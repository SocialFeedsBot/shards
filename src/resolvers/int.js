module.exports = (client, message, input, options = {}) => {
  if (isNaN(input)) {
    return null;
  } else {
    input = parseInt(input);
  }

  return input;
};
