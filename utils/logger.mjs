export const log = {
  success,
  error,
  info,
  neutral,
  help,
};

function success(msg) {
  console.log(`✅ ${msg}`);
}

function error(msg, error) {
  console.log(`❌ ${msg}`, error ?? '');
}

function info(msg) {
  console.log(`✨ ${msg}`);
}

function neutral(msg) {
  console.log(` > ${msg}`);
}

function help(msg) {
  console.log(`🤔 ${msg}`);
}
