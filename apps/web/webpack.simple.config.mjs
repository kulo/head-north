import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { VueLoaderPlugin } from 'vue-loader';
import webpack from 'webpack';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isDev = argv.mode === 'development';
  
  return {
    entry: './src/main.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDev ? '[name].js' : '[name].[contenthash].js',
      publicPath: '/',
      clean: true
    },
    
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
          options: {
            appendTsSuffixTo: [/\.vue$/],
            transpileOnly: isDev, // Faster builds in dev mode
            configFile: 'tsconfig.relaxed.json' // Use relaxed config to avoid strict type errors
          }
        },
        {
          test: /\.(css|scss|sass)$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [['autoprefixer']]
                }
              }
            },
            {
              loader: 'sass-loader',
              options: {
                api: 'modern', // Use modern Sass API
                sassOptions: {
                  silenceDeprecations: ['legacy-js-api']
                }
              },
            }
          ]
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp)$/i,
          type: 'asset/resource'
        }
      ]
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'vue': 'vue/dist/vue.esm-bundler.js',
      '@omega/types': path.resolve(__dirname, '../../packages/shared-types/dist'),
      '@omega/utils': path.resolve(__dirname, '../../packages/shared-utils/dist'),
      '@omega/config': path.resolve(__dirname, '../../packages/shared-config/dist')
      },
      extensions: ['.ts', '.js', '.vue', '.json']
    },
    
    plugins: [
      new VueLoaderPlugin(),
      new HtmlWebpackPlugin({
        template: './index.html',
        title: 'Omega One'
      }),
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
        'process.env.NODE_ENV': JSON.stringify(argv.mode || 'development')
      })
    ],
    
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist')
        },
        {
          directory: path.join(__dirname, 'public'),
          publicPath: '/'
        }
      ],
      port: 8080,
      hot: true,
      open: false,
      historyApiFallback: true,
      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:3000',
          changeOrigin: true,
          pathRewrite: {
            '^/api': ''
          }
        }
      ]
    },
    
    optimization: {
      splitChunks: isDev ? false : {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    },
    
    devtool: isDev ? 'eval-source-map' : 'source-map',
    
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }
  };
};
