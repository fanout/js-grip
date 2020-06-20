module.exports = {
  extends: ["plugin:prettier/recommended"],
  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true
    },
    ecmaVersion: 2017,
    sourceType: "module"
  }
};
