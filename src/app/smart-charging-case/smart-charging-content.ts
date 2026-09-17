export interface SmartChargingScreen {
  file: string;
  caption: string;
  width: number;
  height: number;
}

export interface SmartChargingChapter {
  id: string;
  title: string;
  subtitle: string;
  copy: string;
  screens: SmartChargingScreen[];
  supporting: SmartChargingScreen[];
}

export const SMART_CHARGING_ASSET_ROOT = '/projects/carregadoresEletricos/';

export const SMART_CHARGING_CHAPTERS: readonly SmartChargingChapter[] = [
  {
    "id": "overview",
    "title": "Visão Global",
    "subtitle": "Uma plataforma operacional, do território ao ponto de carregamento.",
    "copy": "Concebida para responder às necessidades de gestão de uma frota operacional, a plataforma liga localizações, parques, carregadores, veículos, reservas e permissões numa única experiência, com uma arquitetura preparada para diferentes operações e contextos.",
    "screens": [
      {
        "file": "Group 3190.png",
        "caption": "Visão geográfica das localizações e estados dos carregadores",
        "width": 1900,
        "height": 1080
      }
    ],
    "supporting": []
  },
  {
    "id": "parking",
    "title": "Do Mapa ao Parque",
    "subtitle": "Plantas reais, espaços interativos e estados visuais.",
    "copy": "Cerca de 50 plantas de parques foram desenhadas individualmente a partir dos planos do cliente. O parque circular e o parque retangular representam edifícios distintos — não variantes da mesma localização. As cores dos lugares comunicam disponibilidade, utilização, reserva, carregamento e falhas.",
    "screens": [
      {
        "file": "Group 3193.png",
        "caption": "Parque circular — representação circular do parque",
        "width": 1900,
        "height": 1080
      },
      {
        "file": "Group 3192.png",
        "caption": "Outro edifício — planta retangular do parque",
        "width": 1900,
        "height": 1080
      }
    ],
    "supporting": []
  },
  {
    "id": "reservations",
    "title": "Reservas",
    "subtitle": "A representação física transforma-se numa ação operacional.",
    "copy": "A seleção de um lugar permite reservar o carregamento, associando localização, cartão, tipo de conector, potência, data e hora, com opções de lembrete.",
    "screens": [
      {
        "file": "Group 3197.png",
        "caption": "Reserva de lugar e carregamento com opções de lembrete",
        "width": 1900,
        "height": 1080
      }
    ],
    "supporting": []
  },
  {
    "id": "chargers",
    "title": "Gestão de Carregadores",
    "subtitle": "Da infraestrutura física à informação técnica.",
    "copy": "Estado dos conectores, dados técnicos e gestão OCPP acompanham os fluxos de configuração de carregadores e localizações.",
    "screens": [
      {
        "file": "Group 3196.png",
        "caption": "Detalhe técnico do carregador e estados dos conectores",
        "width": 1900,
        "height": 1080
      }
    ],
    "supporting": [
      {
        "file": "Frame 845.png",
        "caption": "Adicionar carregadores e definir coordenadas no mapa",
        "width": 1900,
        "height": 1080
      },
      {
        "file": "Group 3201.png",
        "caption": "Adicionar uma localização geográfica",
        "width": 1900,
        "height": 1080
      }
    ]
  },
  {
    "id": "permissions",
    "title": "Gestão e Permissões",
    "subtitle": "Acesso organizado por pessoas, veículos e infraestrutura.",
    "copy": "Cartões e permissões ligam utilizadores, veículos e grupos às localizações e aos carregadores. A gestão da frota integra-se no mesmo sistema operacional.",
    "screens": [
      {
        "file": "Group 3199.png",
        "caption": "Cartões e permissões por localização, utilizador e veículo",
        "width": 1900,
        "height": 1080
      },
      {
        "file": "Group 3203.png",
        "caption": "Gestão da frota e dados dos veículos",
        "width": 1900,
        "height": 1080
      }
    ],
    "supporting": []
  },
  {
    "id": "statistics",
    "title": "Dados e Estatísticas",
    "subtitle": "Monitorização para além do mapa.",
    "copy": "Filtros e gráficos apoiam a leitura das transações e da atividade dos carregadores, ligando operação diária e análise.",
    "screens": [
      {
        "file": "Group 3198.png",
        "caption": "Estatísticas de transações e atividade do carregador",
        "width": 1900,
        "height": 1285
      }
    ],
    "supporting": []
  }
];
