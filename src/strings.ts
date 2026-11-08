// Toàn bộ chữ trong game nằm ở đây để sau này dịch được.
export const S = {
  title: 'One Day · bản thử 0.1',
  help: {
    title: 'Hướng dẫn',
    resume: 'Chơi tiếp',
    desktop: [
      'Đi lại: W A S D hoặc phím mũi tên',
      'Xoay camera: giữ chuột trái và kéo',
      'Mở/đóng hướng dẫn: phím Esc hoặc nút ?',
    ],
    touch: [
      'Đi lại: kéo joystick bên trái',
      'Xoay camera: vuốt ở nửa bên phải màn hình',
      'Mở hướng dẫn: nút ?',
    ],
    sceneTitle: 'Màn này',
    scene: 'Bản thử phòng trọ: đi một vòng xem đồ đạc đã đúng chỗ chưa. Nhiệm vụ sẽ có ở bản sau.',
  },
  story: {
    snooze: ['5 phút nữa thôi…', 'Thêm 5 phút, thề luôn…', 'Chăn ấm quá…', 'Mai đi làm sớm bù…', 'Ngủ nốt lần này thôi…', 'Ơ… mấy giờ rồi nhỉ…'],
    wrongTube: 'Ối, sữa rửa mặt! Phì phì… mất 2 phút súc miệng.',
    washFail: 'Té nước ướt hết áo rồi, làm lại!',
  },
  rotate: 'Xoay ngang điện thoại để chơi nhé',
  noWebGL:
    'Trình duyệt này chưa hỗ trợ đồ họa 3D (WebGL2). Bạn thử mở bằng Chrome hoặc Safari bản mới nhé.',
  labels: {
    door: 'Cửa',
    kitchen: 'Bếp',
    lavabo: 'Lavabo',
    toilet: 'Bồn cầu',
    fridge: 'Tủ lạnh',
    deskMine: 'Bàn của Anh',
    shelf: 'Kệ',
    mirror: 'Gương',
    bed: 'Giường',
    wardrobe: 'Tủ quần áo',
    fridge2: 'Tủ lạnh 2',
    deskFriend: 'Bàn bạn cùng phòng',
  },
} as const
