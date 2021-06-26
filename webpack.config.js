var path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  devtool: 'inline-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    liveReload: true,
    port: 9000,
  },
  plugins: [new HtmlWebpackPlugin()],
}
