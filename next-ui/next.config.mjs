/** @type {import('next').NextConfig} */

import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push(
      ...[
        {
          test: /\.csv$/,
          use: [
            {
              loader: 'file-loader',
            },
          ],
        },
      ]
    )
    return config
  },
}

export default withNextIntl(nextConfig)
