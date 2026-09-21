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
    "copy": "A navegação preservava o contexto espacial à medida que o utilizador passava de uma visão geográfica ampla para a localização e, por fim, para o parque onde podia consultar os lugares de carregamento.",
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
    "copy": "Múltiplas plantas de parques foram desenhadas individualmente a partir das plantas fornecidas. O parque circular e o parque retangular representam edifícios distintos, cada um com a sua configuração física.",
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
    "copy": "Ao chegar à planta, o utilizador precisava de encontrar onde carregar dentro daquele espaço físico. A decisão foi permitir selecionar diretamente um lugar EV verde — disponível — para abrir o formulário de reserva desse lugar.",
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
    "title": "Infraestrutura de Carregamento",
    "subtitle": "Da infraestrutura física à informação técnica.",
    "copy": "A configuração começa pela localização geográfica, seguida dos carregadores associados. A gestão técnica reúne conectores, estados, comandos e logs OCPP e informação operacional.",
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
        "file": "Group 3201.png",
        "caption": "Adicionar uma localização geográfica",
        "width": 1900,
        "height": 1080
      },
      {
        "file": "Frame 845.png",
        "caption": "Adicionar carregadores e definir coordenadas no mapa",
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
