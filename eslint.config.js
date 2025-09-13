import { defineConfig } from "eslint/config";
import globals from "globals";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports'


export default defineConfig([
  {
    ignores: [
      './node_modules',
      './coverage',
      './eslint.config.js',
      './babel.config.cjs',
      './src/pairtest/lib/TicketTypeRequest.js',
      './src/thirdparty/seatbooking/SeatReservationService.js',
      './src/thirdparty/paymentgateway/TicketPaymentService.js',
      './logs',
    ]
  },
  {
    files: ["**/*.js"], 
    languageOptions: {
      globals:{
        ...globals.jest,
        ...globals.node,
      }
    }
  },
  {
    plugins: {
      prettier: eslintPluginPrettier,
      'unused-imports': eslintPluginUnusedImports
    }
  },
  {
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'error',
      'prettier/prettier': [
        'error', 
        {
          singleQuote: true,
          trailingComma: 'es5',
          printWidth: 100,
          "endOfLine": "auto"
        }]
    }
  },
  {
    settings: {
      'prettier': eslintPluginPrettier
    }
  }
]);
