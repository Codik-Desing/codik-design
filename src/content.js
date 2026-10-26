import { demoModels } from "./demo-models";

export const studio = {
  nome: "CODIK DESIGN",
  slogan: "sites com identidade e estratégia",
  whatsapp: "", // ex.: 5511999999999
  email: "codikdev@gmail.com", // ex.: contato@codik.design
  instagram: "", // ex.: https://instagram.com/codikdesign
  membros: ["Isaías", "Rodrigo", "Nicolas"],
  // TODO: informar fotos reais e funções aprovadas pelos três sócios.
  equipe: [
    {
      nome: "Isaías",
      foto: null,
      funcao: null,
      github: "https://github.com/Is-Lucas",
    },
    {
      nome: "Rodrigo",
      foto: null,
      funcao: null,
      github: "https://github.com/Skyyyzz",
    },
    {
      nome: "Nicolas",
      foto: null,
      funcao: null,
      github: "https://github.com/niczinzx",
    },
  ],
};

export const tiposDeSite = [
  {
    id: "institucional",
    nome: "Site institucional",
    frase: "Pra apresentar sua marca de um jeito profissional.",
    descricao:
      "Ideal para empresas, consultórios, estúdios e negócios locais que precisam passar confiança, mostrar serviços e abrir contato fácil.",
    itens: [
      "Páginas de serviços",
      "Apresentação da empresa",
      "Botão para WhatsApp e formulário",
    ],
  },
  {
    id: "landing",
    nome: "Landing page",
    frase: "Foco em campanha, captação e conversão.",
    descricao:
      "Perfeito para anúncios, lançamentos, eventos, promoções ou um serviço específico que precisa transformar visita em mensagem.",
    itens: [
      "Página única objetiva",
      "CTA forte",
      "Estrutura pensada para vender",
    ],
  },
  {
    id: "catalogo",
    nome: "Catálogo / vitrine",
    frase: "Pra expor produtos sem complicar.",
    descricao:
      "Uma ótima opção para lojas, floriculturas, cardápios, catálogos de serviços e vitrines de produtos que precisam ser bonitos e fáceis de navegar.",
    itens: [
      "Listagem de itens",
      "Organização por categorias",
      "Destaques e chamadas para pedido",
    ],
  },
  {
    id: "portfolio",
    nome: "Portfólio",
    frase: "Pra mostrar trabalho com presença e estilo.",
    descricao:
      "Bom para arquitetos, designers, barbeiros, fotógrafos, criativos e profissionais que precisam fazer a própria imagem trabalhar por eles.",
    itens: ["Galerias visuais", "Projetos em destaque", "Contato direto"],
  },
];

export const trabalhos = [
  {
    slug: "brasa",
    num: "01",
    nome: "Brasa",
    categoria: "Gastronomia",
    tipo: "institucional",
    tipoLabel: "Site institucional",
    descricao:
      "Modelo de restaurante com clima forte, cardápio em destaque e caminho rápido para reserva.",
    resumo:
      "Bom para restaurantes, hamburguerias e cafés que querem sair do comum.",
    estilo: "brasa",
    demo: "/demos/brasa.html",
    ano: "Modelo conceito",
  },
  {
    slug: "corte",
    num: "02",
    nome: "Corte 013",
    categoria: "Beleza",
    tipo: "landing",
    tipoLabel: "Landing page",
    descricao:
      "Barbearia com linguagem jovem, tabela de serviços clara e chamada direta para agendamento.",
    resumo: "Ideal para barbearia, estúdio de tattoo ou estética masculina.",
    estilo: "corte",
    demo: "/demos/corte.html",
    ano: "Modelo conceito",
  },
  {
    slug: "morada",
    num: "03",
    nome: "Morada",
    categoria: "Arquitetura",
    tipo: "portfolio",
    tipoLabel: "Portfólio",
    descricao:
      "Modelo editorial para quem precisa mostrar projetos com elegância e pouco ruído visual.",
    resumo: "Combina com arquitetura, interiores, fotografia e design.",
    estilo: "morada",
    demo: "/demos/morada.html",
    ano: "Modelo conceito",
  },
  {
    slug: "forma",
    num: "04",
    nome: "Forma",
    categoria: "Fitness",
    tipo: "landing",
    tipoLabel: "Landing page",
    descricao:
      "Página rápida, direta e energética para planos, aulas, eventos ou academia.",
    resumo: "Boa para personal, academia, cross training e studios.",
    estilo: "forma",
    demo: "/demos/forma.html",
    ano: "Modelo conceito",
  },
  {
    slug: "flora",
    num: "05",
    nome: "Flora",
    categoria: "Comércio",
    tipo: "catalogo",
    tipoLabel: "Catálogo / vitrine",
    descricao:
      "Vitrine delicada para encomendas, presentes e produtos que dependem de boa apresentação.",
    resumo: "Funciona bem para floricultura, confeitaria e presentes.",
    estilo: "flora",
    demo: "/demos/flora.html",
    ano: "Modelo conceito",
  },
  {
    slug: "pixel",
    num: "06",
    nome: "Pixelware",
    categoria: "Tecnologia",
    tipo: "institucional",
    tipoLabel: "Site institucional",
    descricao:
      "Página de produto digital com apresentação clara, blocos de recursos e oferta comercial.",
    resumo: "Ótimo para software house, startup, suporte ou serviços de TI.",
    estilo: "pixel",
    demo: "/demos/pixel.html",
    ano: "Modelo conceito",
  },
  ...demoModels.map((item, index) => ({
    ...item,
    num: String(index + 7).padStart(2, "0"),
    tipoLabel: tiposDeSite.find((type) => type.id === item.tipo).nome,
    estilo: item.slug,
    demo: `/demos/${item.slug}.html`,
    ano: "Modelo conceito",
    novo: true,
  })),
];

export const filtrosCategoria = [
  "Todos",
  "Gastronomia",
  "Beleza",
  "Arquitetura",
  "Fitness",
  "Comércio",
  "Tecnologia",
];
