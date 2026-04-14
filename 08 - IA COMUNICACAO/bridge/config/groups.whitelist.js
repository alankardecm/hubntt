const {
  DEFAULT_ALLOWED_GROUPS,
  DEFAULT_EXCLUDED_GROUPS,
} = require('../../../src/lib/waGroups');

module.exports = {
  // Lista opcional de grupos autorizados.
  // Aceita:
  // - JID do grupo: "120363xxxxxxxx@g.us"
  // - Nome do grupo em minusculo: "noc x net turbo"
  //
  // Se vazia, o bridge captura todos os grupos em que o numero estiver presente.
  ALLOWED_GROUPS: DEFAULT_ALLOWED_GROUPS,

  // Grupos que nunca devem ser monitorados.
  // Use o mesmo padrao:
  // - JID do grupo
  // - nome do grupo em minusculo
  EXCLUDED_GROUPS: DEFAULT_EXCLUDED_GROUPS,
};
