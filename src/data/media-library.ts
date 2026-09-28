export type MediaLibraryItem = {
  id: string;
  title: string;
  category: string;
  url: string;
  credit: string;
};

export const coverLibrary: MediaLibraryItem[] = [
  {
    id: "jardim-botanico",
    title: "Jardim botânico",
    category: "Romântico",
    url: "/media-library/capa-jardim.jpg",
    credit: "Unsplash",
  },
  {
    id: "flores-claras",
    title: "Flores claras",
    category: "Elegante",
    url: "/media-library/capa-romantica.jpg",
    credit: "Unsplash",
  },
  {
    id: "celebracao",
    title: "Celebração",
    category: "Festa",
    url: "/media-library/galeria-celebracao.jpg",
    credit: "Unsplash",
  },
  {
    id: "baby-shower",
    title: "Baby shower",
    category: "Infantil",
    url: "/media-library/galeria-baby-shower.jpg",
    credit: "Unsplash",
  },
];

export const galleryLibrary: MediaLibraryItem[] = [
  coverLibrary[2],
  coverLibrary[3],
  coverLibrary[0],
  coverLibrary[1],
].filter((item): item is MediaLibraryItem => Boolean(item));

export const royaltyFreeSources = {
  music: {
    label: "Pixabay Music",
    url: "https://pixabay.com/music/",
    description: "Músicas gratuitas para uso em projetos, sempre confira a licença da faixa.",
  },
  video: {
    label: "Pexels Videos",
    url: "https://www.pexels.com/videos/",
    description: "Vídeos gratuitos para inspiração e uso conforme a licença do autor.",
  },
};

export const videoLibrary: MediaLibraryItem[] = [
  {
    id: "quinze-anos-envelope-pop-up",
    title: "Envelope pop-up · 15 anos",
    category: "Abertura especial",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663982227127/jbXfyNqUHGZBQsPc.mp4",
    credit: "Vídeo original do cliente",
  },
];
