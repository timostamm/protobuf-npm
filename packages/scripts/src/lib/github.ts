/**
 * Bare minimum of a release on GitHub.
 */
export type GithubRelease = {
  name: string;
  tag_name: string;
  prerelease: boolean;
  assets: GithubReleaseAsset[];
};

/**
 * Bare minimum of a release asset on GitHub.
 */
export type GithubReleaseAsset = {
  name: string; // e.g. protoc-31.1-linux-aarch_64.zip
  content_type: string; // e.g. application/zip
  browser_download_url: string; // e.g. https://github.com/protocolbuffers/protobuf/releases/download/v31.1/protoc-31.1-linux-aarch_64.zip
};

export async function listGithubReleases(owner: string, repo: string) {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  });
  if (process.env.GH_TOKEN) {
    headers.set("Authorization", `Bearer ${process.env.GH_TOKEN}`);
  }
  const results: GithubRelease[] = [];
  for (let page = 1; ; page++) {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=30&page=${page}`;
    const response = await fetch(url, {
      method: "GET",
      headers,
    });
    if (response.status !== 200) {
      throw new Error(
        `Unexpected status code: ${response.status} for GET ${url}`,
      );
    }
    const items = (await response.json()) as GithubRelease[];
    results.push(...items);
    const link = response.headers.get("link") ?? "";
    if (!link.includes(`; rel="next"`)) {
      break;
    }
  }
  return results;
}

/**
 * Fetch release info from GitHub.
 *
 * Version, with or without a leading "v", or "latest".
 */
export async function fetchGithubRelease(
  owner: string,
  repo: string,
  version: string,
) {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  });
  if (process.env.GH_TOKEN) {
    headers.set("Authorization", `Bearer ${process.env.GH_TOKEN}`);
  }
  if (version !== "latest" && version.startsWith("v")) {
    version = version.slice(1);
  }
  const url =
    version === "latest"
      ? `https://api.github.com/repos/${owner}/${repo}/releases/latest`
      : `https://api.github.com/repos/${owner}/${repo}/releases/tags/v${version}`;
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  if (response.status !== 200) {
    throw new Error(
      `Unexpected status code: ${response.status} for GET ${url}`,
    );
  }
  return (await response.json()) as GithubRelease;
}
