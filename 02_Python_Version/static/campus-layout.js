// Relative positions read from the official Ver.2023 map published 2024-08-28.
// Coordinates below use an 1888px-wide reference image; they are NOT GPS coordinates.
export const mapSource = "https://xfjy.chd.edu.cn/info/1024/12168.htm";
export const locate = (x, y) => [(x - 1000) / 40, 0, (y - 535) / 40];
export const layout = {
  library: { position: locate(1160, 545), mapName: "逸夫图书馆" },
  study: { position: locate(1000, 530), mapName: "修远教学楼" },
  life: { position: locate(760, 520), mapName: "鸿翔园生活社区" },
  activities: { position: locate(1570, 550), mapName: "长安文化艺术中心" },
  highway: { position: locate(393, 625), mapName: "公路学院组团" },
  materials: { position: locate(270, 725), mapName: "建工·材料组团" },
  information: { position: locate(985, 415), mapName: "信息·交通组团" },
};
export const communities = [
  {
    name: "西区生活社区",
    x: 760,
    y: 525,
    blocks: [
      [696, 495],
      [696, 535],
      [696, 575],
      [875, 492],
      [875, 535],
      [875, 573],
    ],
  },
  {
    name: "东区生活社区",
    x: 1460,
    y: 450,
    blocks: [
      [1430, 468],
      [1430, 513],
      [1430, 548],
      [1430, 589],
      [1535, 398],
      [1535, 443],
      [1535, 482],
      [1660, 520],
      [1660, 550],
      [1510, 309],
      [1510, 338],
    ],
  },
  {
    name: "西侧生活组团",
    x: 380,
    y: 525,
    blocks: [
      [297, 500],
      [289, 540],
      [394, 503],
      [445, 503],
      [390, 544],
      [447, 546],
    ],
  },
];
export const mapLabels = [
  ...Object.entries(layout).map(([key, p]) => ({
    key,
    name: p.mapName,
    position: p.position,
  })),
];
