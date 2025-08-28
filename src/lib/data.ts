export type MangaWork = {
  id: string;
  title: string;
  author: string;
  volumes: string;
  summary: string;
  cover: string;
};

export const WORKS: MangaWork[] = [
  {
    id: "219177",
    title: "ピグマリオ",
    author: "和田慎二",
    volumes: "全27巻",
    summary:
      "まだ神々が人々の目に見えて導いていた時代。ルーン国の王子クルトは母親の顔を知らず育ったが8歳のときに真実をしり、旅に出る事を決意する。",
    cover:
      "https://res.cloudinary.com/hstqcxa7w/image/fetch/s--eiV6zeSG--/c_fit,f_auto,fl_lossy,h_256,q_auto,w_180/https://manba-storage-production.s3-ap-northeast-1.amazonaws.com/uploads/board/thumbnail/219177/c012c17c-4b2a-4113-ad97-559f6edd12fb.png",
  },
  {
    id: "196759",
    title: "はにま通信",
    author: "大山海",
    volumes: "2巻まで刊行",
    summary:
      "奈良の高校生・埴田麻央は古墳めぐりに夢中。好きが高じて『古墳部』を立ち上げる青春ストーリー。",
    cover:
      "https://res.cloudinary.com/hstqcxa7w/image/fetch/s--DPyR_nJi--/c_fit,f_auto,fl_lossy,h_256,q_auto,w_180/https://manba-storage-production.s3-ap-northeast-1.amazonaws.com/uploads/book/regular_thumbnail/983899/c5015276-da90-4497-8cde-8ccfcd7fe4da.jpg",
  },
  {
    id: "217211",
    title: "秘密法人デスメイカー",
    author: "鰻田まあち",
    volumes: "1巻まで刊行",
    summary:
      "ヒーロー作品が大好きな怪人デュアルホーン。ヒーローを作ればいいのでは？から始まる暗黒コメディ。",
    cover:
      "https://res.cloudinary.com/hstqcxa7w/image/fetch/s--bTf8AWt3--/c_fit,f_auto,fl_lossy,h_256,q_auto,w_180/https://manba-storage-production.s3-ap-northeast-1.amazonaws.com/uploads/book/regular_thumbnail/983253/8f851e02-cb87-4026-8934-f8f28d788993.jpg",
  },
];
