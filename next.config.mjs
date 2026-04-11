/** @type {import('next').NextConfig} */
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? ""
const isUserSite = repositoryName.endsWith(".github.io")
const inferredBasePath = repositoryName && !isUserSite ? `/${repositoryName}` : ""
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? inferredBasePath

const nextConfig = {
    output: "export",
    transpilePackages: ["three"],
    images: {
        unoptimized: true,
    },
    basePath,
    assetPrefix: basePath ? `${basePath}/` : undefined,
    env: {
        NEXT_PUBLIC_BASE_PATH: basePath,
    },
}

export default nextConfig
