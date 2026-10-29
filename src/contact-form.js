export const deadlines = [
  "Até 30 dias",
  "De 1 a 3 meses",
  "Sem pressa",
  "Vamos definir juntos",
];
export const budgets = [
  "Até R$ 2.000",
  "De R$ 2.000 a R$ 5.000",
  "De R$ 5.000 a R$ 10.000",
  "Acima de R$ 10.000",
  "Ainda não defini",
];

export function emptyContact(model = "personalizado") {
  return {
    nome: "",
    email: "",
    whatsapp: "",
    tipo: model,
    descricao: "",
    prazo: "",
    investimento: "",
    aceite: false,
    botField: "",
  };
}

export function phoneDigits(value) {
  const digits = value.replace(/\D/g, "");
  return (
    digits.length > 11 && /^\s*\+?55/.test(value) ? digits.slice(2) : digits
  ).slice(0, 11);
}

export function formatPhone(value) {
  const digits = phoneDigits(value);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const local = digits.slice(2);
  const split = local.length > 8 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${local.slice(0, split)}${local.length > split ? `-${local.slice(split)}` : ""}`;
}

export function validateContact(form) {
  const errors = {};
  if (!form.nome.trim())
    errors.nome = "Conta pra gente como podemos te chamar.";
  if (
    !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/.test(
      form.email.trim(),
    )
  ) {
    errors.email = "Confira seu e-mail. Exemplo: voce@empresa.com";
  }
  if (
    form.whatsapp &&
    !/^[1-9]{2}[0-9]{8,9}$/.test(phoneDigits(form.whatsapp))
  ) {
    errors.whatsapp = "Inclua o DDD e os 8 ou 9 dígitos do telefone.";
  }
  if (form.descricao.trim().length < 10)
    errors.descricao = "Conte um pouquinho mais: pelo menos 10 caracteres.";
  if (!form.aceite)
    errors.aceite = "Autorize o contato para que a gente possa responder.";
  return errors;
}
