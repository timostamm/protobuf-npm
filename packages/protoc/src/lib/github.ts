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

/**
 * Fetch release info from GitHub.
 *
 * Version without a leading "v", or "latest".
 */
export async function fetchGithubRelease(
  owner: string,
  repo: string,
  version: string,
) {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    //"Authorization": `Bearer ${x}`,
    "X-GitHub-Api-Version": "2022-11-28",
  });
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
