/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazon.com' },
      { protocol: 'https', hostname: '**.media-amazon.com' },
      { protocol: 'https', hostname: '**.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: '**.ebayimg.com' },
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: 'thumbs.ebaystatic.com' },
      { protocol: 'https', hostname: 'importadoraimc.cl' },
      { protocol: 'https', hostname: 'imcbox.cl' },
      { protocol: 'https', hostname: 'imccargo.cl' },
    ],
  },
}

module.exports = nextConfig
