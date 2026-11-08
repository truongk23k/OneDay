# One Day: tài liệu thiết kế

Ngày viết: 2026-11-08 · Repo: https://github.com/truongk23k/OneDay

Ký hiệu: những gì tác giả đã nói thì ghi bình thường. Những chỗ Claude tự quyết thì ghi **[Claude chọn]** để tác giả soát lại.

## 1. Ý tưởng và lý do

"One Day" (tên lấy theo repo, **[Claude chọn]** làm tên tạm) là một game 3D vui chơi trên trình duyệt, lấy cảm hứng từ phòng trọ và buổi sáng thật của tác giả. Có hai nhân vật:
- **Anh ❤️**: nhân vật người chơi điều khiển, làm lập trình viên.
- **Em ❤️**: bạn gái của Anh, làm văn phòng.

Người chơi ngủ dậy trong phòng trọ, làm các việc buổi sáng, nhắn tin cho Em, chạy xe đi đón Em, chở Em tới chỗ làm rồi đua về công ty cho kịp giờ.

Tác giả sẽ đăng game lên mạng cho mọi người chơi vui. Game phải chơi tốt trên cả **điện thoại và máy tính**, chỉ cần mở một đường link, và được **tối ưu kỹ để đa số mọi người chơi được**, kể cả trên máy yếu.

Cái hay của game: buổi sáng đi làm rất quen thuộc với người Việt (báo lại 5 phút, tìm chìa khóa, người yêu nhắn "Dậy chưa", kẹt xe, ổ gà). Thêm vào đó là một lựa chọn khó: chạy nhanh để kịp giờ hay chạy êm để Em không giận.

## 2. Mục tiêu, không làm, và thế nào là thất bại

**Mục tiêu**
- Một lượt chơi trọn vẹn khoảng 6–8 phút, có nhiều kết thúc để người chơi muốn chơi lại.
- Mở link là chơi được ngay, tải nhanh, chạy mượt trên đa số điện thoại, kể cả máy phổ thông đời cũ.
- Phòng trọ và chiếc xe giống đồ thật của tác giả; hai nhân vật giống người thật ở mức đại khái.
- Hài hước, đậm chất đời sống Việt Nam.

**Không làm ở bản đầu**
- Bảng xếp hạng online, tài khoản, chơi nhiều người, lưu lên máy chủ.
- Nhiều ngày hoặc nhiều chương.
- Tiếng Anh (nhưng chữ trong game để riêng một chỗ, sau này dịch được).
- Đưa lên App Store hay Google Play.

**Coi là thất bại, dù game vẫn chạy**
- Tải lâu, giật hoặc nóng máy trên điện thoại.
- Điều khiển cảm ứng khó chịu, nhất là lúc lái xe.
- Gắn logo hay tên thương hiệu thật lên đồ vật trong game (xe, điện thoại, tủ lạnh…).
- Ảnh cá nhân của tác giả (phòng, người, xe) bị đưa lên repo công khai.

## 3. Ràng buộc

- Chạy trên trình duyệt (Chrome, Safari, Edge; cả Android và iPhone), đưa lên dạng web tĩnh, không cần máy chủ.
- Repo `truongk23k/OneDay` là **công khai**. Ảnh tham khảo nằm ở thư mục `anh-tham-khao/` cạnh repo trên máy tác giả (ngoài repo) và **không bao giờ được commit**, nhất là ảnh chân dung trong `nhanvat/`. Chỉ commit mô hình và texture đã làm lại theo phong cách low-poly.
- Ngôn ngữ trong game: tiếng Việt.
- Mô hình 3D dựng trong Blender (Claude điều khiển qua Blender MCP; máy tác giả đang chạy Blender 5.2.3 LTS).
- Máy thử chính của tác giả: **iPhone 13** (Safari).

Ảnh tham khảo hiện có:

| Thư mục | Nội dung |
|---|---|
| `nhatro/` | Sơ đồ phòng (`soDo.png`), ảnh nhìn từ cửa vào, cửa ra vào, giường, góc bàn của tác giả, bếp, nhà vệ sinh |
| `xe/` | Air Blade 2026 đen nhám |
| `dienthoai/` | iPhone 13 màu xanh lá |
| `nhanvat/` | Ảnh chân dung để làm Anh và Em |

## 4. Kịch bản

### 4.1 Đồng hồ và chỉ số

| Mốc | Sự kiện |
|---|---|
| 7:30 | Báo thức reo (**[Claude chọn]** giờ này) |
| 8:25 | Hạn chót chở Em tới chỗ làm |
| 8:30 | Hạn chót chấm công ở công ty của Anh |

- Đồng hồ trong game chạy liên tục từ 7:30, nhanh hơn giờ thật để cả buổi sáng gói gọn trong khoảng 6–8 phút chơi. Tốc độ cụ thể để người làm game tinh chỉnh.
- Có 3 chỉ số:
  - **Giờ giấc**: chính là đồng hồ.
  - **Độ thơm tho**: tăng khi đánh răng, rửa mặt, mặc đồ tử tế; giảm khi bỏ việc hoặc bị mưa ướt.
  - **Tâm trạng của Em**: thay đổi theo tin nhắn, bộ đồ Anh mặc, có mang mũ bảo hiểm cho Em không, cách lái xe, và có tới kịp 8:25 hay không.

### 4.2 Màn 1: Báo thức (7:30)

Anh nằm trên giường. Màn hình điện thoại reo, có hai nút: **Dậy** và **Báo lại 5 phút**. Mỗi lần báo lại, Anh than một câu (ví dụ "5 phút nữa thôi…") và đồng hồ nhảy thêm 5 phút. Nếu cứ báo lại tới khi không còn cách nào kịp giờ, game kết thúc sớm với kết thúc "Ngủ quên" (**[Claude chọn]**).

Điện thoại trong game (báo thức và chat) có dáng giống iPhone 13 xanh lá của tác giả nhưng không có logo Apple (**[Claude chọn]**).

### 4.3 Màn 2: Phòng trọ (đi lại tự do trong 3D)

**Bố cục phòng** theo sơ đồ của tác giả (nhìn từ trên xuống, cửa ở tường trên):

| Vị trí | Đồ vật |
|---|---|
| Tường trên, giữa | Cửa gỗ nâu có ô thoáng song sắt; hai mũ bảo hiểm đen treo trên cửa |
| Góc trên bên trái | Bếp: bệ chữ L mặt gạch đỏ, bồn rửa inox, giá bát 3 tầng, bếp từ, chai lọ gia vị, tường dán giấy bạc |
| Góc trên bên phải | Nhà vệ sinh: cửa kính mờ khung trắng, bồn cầu, lavabo nhỏ, khăn đen trên thanh treo |
| Giữa bên trái | Bàn của bạn cùng phòng: laptop, 2 màn hình, ghế công thái học trắng đen; cửa sổ song sắt trắng và điều hòa trên tường |
| Giữa bên phải | Tủ lạnh nhỏ màu bạc (nồi chiên không dầu đặt trên nóc) và bàn của tác giả: màn hình, laptop, ghế lưới đen, kệ gỗ có gấu bông, gương đứng viền hồng |
| Góc dưới bên trái | Tủ quần áo trắng phối gỗ, đồ đạc chất trên nóc; tủ lạnh nhỏ thứ hai đặt cạnh |
| Góc dưới bên phải | Giường gỗ thấp trải chiếu trúc, chăn đỏ, chăn tím nhạt, gối hồng |

Đồ lặt vặt tạo không khí: quạt đứng, ghế nhựa đỏ, ghế nhựa xanh xếp chồng, nồi cơm điện, ấm siêu tốc, vali đen, sàn gạch trắng. Chi tiết cụ thể so theo ảnh trong `nhatro/`.

**Việc cần làm.** Góc màn hình có danh sách việc; làm theo thứ tự nào cũng được, bỏ việc nào cũng được nhưng sẽ bị trừ điểm lúc kết thúc.

- **Đánh răng** (ở lavabo nhà vệ sinh): trò chơi nhỏ, chà qua lại cho đầy thanh (điện thoại vuốt qua lại, máy tính nhấn A/D xen kẽ). Có bẫy: tuýp kem đánh răng nằm cạnh sữa rửa mặt, lấy nhầm là ra cảnh hài và mất thời gian.
- **Rửa mặt** (ở lavabo): giữ nút để vốc nước, thả đúng lúc.
- **Chọn đồ** (ở tủ quần áo): chọn áo, quần, giày dép; danh sách đồ ở mục 6. Anh phải **mặc đúng bộ đã chọn** trong suốt phần còn lại của game. Mặc xong có thể soi gương hồng (**[Claude chọn]**). Thời tiết mỗi lượt ngẫu nhiên nắng hoặc mưa; trời mưa mà không lấy áo mưa thì ra đường bị ướt. Mặc bộ "thảm họa" sẽ bị Em chê.
- **Nhắn tin cho Em:** màn hình chat giống điện thoại thật, liên lạc tên **"Em ❤️"**. Chọn câu trả lời từ vài lựa chọn có sẵn. Trả lời khéo thì tâm trạng tăng. Để lâu không trả lời, Em nhắn dồn "??", "Dậy chưa đó 😤". Tin nhắn mới có thể tới cả lúc đang làm việc khác.
- **Tìm chìa khóa xe:** mỗi lượt chìa khóa nằm một chỗ khác (dưới gối, túi quần hôm qua, trên nóc tủ lạnh, cạnh nồi cơm…). Chưa có chìa khóa thì không ra khỏi phòng được.
- **Lấy 2 mũ bảo hiểm trên cửa** (**[Claude chọn]**, lấy ý từ ảnh cửa phòng): một cho Anh, một cho Em. Quên mũ của Em thì lúc đón, Em giận và phải chạy về lấy hoặc Em tụt tâm trạng.

### 4.4 Màn 3: Chạy xe đi đón Em

Xe là **Honda Air Blade 2026 đen nhám**, dựng dáng gần giống theo ảnh nhưng **không có logo Honda và chữ "Air Blade"**. Anh đội mũ bảo hiểm đen nửa đầu. Đường phố kiểu Việt Nam, phong cách low-poly: nhà ống, dây điện chằng chịt, xe buýt, đèn đỏ, ổ gà, hàng xôi lấn đường, đoạn ngập nếu trời mưa. Có hẻm tắt đi nhanh hơn nhưng dễ lạc. Phải dừng đúng trước cửa nhà Em để đón.

Bản đồ là một khu phố nhỏ tự nghĩ ra, không theo bản đồ thật (**[Claude chọn]**).

### 4.5 Màn 4: Chở Em đi làm

Đây là cái khó chính: **chạy nhanh thì kịp giờ, nhưng phanh gấp, va chạm hay lọt ổ gà thì Em giận** ("Chạy từ từ thôi!"). Người chơi phải cân giữa tốc độ và tâm trạng. Thả Em ở chỗ làm, hạn chót **8:25**. Tới sau 8:25 thì tâm trạng tụt mạnh.

### 4.6 Màn 5: Nước rút một mình

Không còn chở ai nên được chạy hết ga tới công ty, hạn chót **8:30**. Chỗ làm của Em ở gần công ty của Anh, chỉ có khoảng 5 phút trong game nên màn này rất gấp. Công ty của Anh là công ty phần mềm; các câu thoại ở cổng công ty có thể đùa về nghề lập trình (**[Claude chọn]**).

### 4.7 Kết thúc

Màn hình chấm công hiện giờ đến và 3 chỉ số. Các kết thúc:

| Kết thúc | Khi nào |
|---|---|
| **"Nhân viên gương mẫu, người yêu quốc dân"** | Cả hai kịp giờ, thơm tho, Em vui |
| Sếp đứng chờ sẵn ở cửa | Tới công ty sau 8:30 |
| Tin nhắn *"Mai em tự đi làm ko cần đón"* | Em giận (tâm trạng thấp hoặc tới sau 8:25) |
| Đồng nghiệp né cả mét | Quên đánh răng |
| Ngủ quên | Báo lại quá nhiều ở Màn 1 (**[Claude chọn]**) |

- Nếu nhiều kết thúc cùng xảy ra: tiêu đề chính lấy theo thứ tự Ngủ quên → Trễ giờ → Em giận → Quên đánh răng → Hoàn hảo; các kết thúc còn lại hiện thành dòng phụ (**[Claude chọn]**).
- Nút **chia sẻ thẻ kết quả** (một tấm ảnh có giờ đến, kết thúc và chỉ số): điện thoại dùng chức năng chia sẻ của máy, máy tính thì tải ảnh về.
- **Bộ sưu tập kết thúc** lưu trong trình duyệt của người chơi, để biết còn kết thúc nào chưa mở (**[Claude chọn]**).

### 4.8 Nút "?" (hướng dẫn)

Luôn nằm ở góc màn hình. Bấm vào thì game tạm dừng và hiện bảng hướng dẫn gồm (**[Claude chọn]** nội dung):
- Cách điều khiển, tự đổi theo thiết bị: bàn phím và chuột trên máy tính, nút cảm ứng trên điện thoại.
- Việc cần làm và mẹo cho màn đang chơi.
- Nút đóng để chơi tiếp.

## 5. Điều khiển và giao diện

| | Máy tính | Điện thoại |
|---|---|---|
| Đi lại | WASD hoặc phím mũi tên, chuột xoay camera | Joystick ảo bên trái, vuốt để xoay camera |
| Tương tác | E hoặc Space | Nút tròn bên phải |
| Lái xe | W ga, S phanh, A/D rẽ | Nút ga và phanh bên phải, nút rẽ bên trái |

- Trên điện thoại game chơi ở **màn hình ngang**; cầm dọc thì hiện lời nhắc xoay ngang (**[Claude chọn]**).
- Góc nhìn **thứ ba** (thấy Anh từ phía sau) để người chơi thấy bộ đồ đã chọn (**[Claude chọn]**).
- Trên màn hình luôn có: đồng hồ, nút "?", nút tạm dừng. Trong phòng thì hiện danh sách việc. Lúc chở Em thì hiện biểu tượng tâm trạng của Em (**[Claude chọn]**).
- Trong bảng tạm dừng có chỉnh **chất lượng hình ảnh** (Thấp / Vừa / Cao) và tắt tiếng (**[Claude chọn]**).
- Có âm thanh: báo thức, nước chảy, tiếng xe máy, còi, nhạc nền vui. Chỉ dùng âm thanh miễn phí bản quyền (CC0 hoặc tương tự).

## 6. Hình ảnh

- Phong cách **low-poly màu tươi**: dễ dựng trong Blender, chạy nhẹ trên điện thoại.
- **Phòng trọ:** theo sơ đồ và ảnh trong `nhatro/` (mục 4.3). Bỏ bớt đồ lặt vặt nếu ảnh hưởng hiệu năng; các đồ có việc cần làm thì phải giữ và dễ nhận ra.
- **Xe:** theo `xe/ab2026.png`, không logo, không chữ thương hiệu.
- **Nhân vật:** giống người thật ở mức đại khái, theo ảnh trong `nhanvat/`. Dùng mẫu nhân vật low-poly miễn phí bản quyền đã có sẵn khung xương và chuyển động, rồi chỉnh kiểu tóc, màu da, quần áo cho giống (**[Claude chọn]**).
  - **Anh:** tóc đen vuốt dựng hơi bù xù. Đi làm thường mặc **quần áo cộc** (áo cộc tay, quần short).
  - **Em:** tóc dài gợn sóng màu nâu đen. Trang phục cố định kiểu **công sở**: quần dài, áo cộc tay. Người chơi không chọn đồ cho Em (**[Claude chọn]**).
- **Tủ đồ của Anh** (**[Claude chọn]** danh sách, tác giả mô tả để Claude tự làm):

  | Loại | Đồ "bình thường" | Đồ "thảm họa" |
  |---|---|---|
  | Áo | 3 áo phông cộc tay (đỏ, đen, trắng), 1 áo polo | Áo ngủ |
  | Quần | Quần short kaki be, quần short đen | Quần đùi hoa |
  | Giày dép | Giày thể thao trắng, dép quai ngang | Dép tổ ong |
  | Khác | Áo mưa (cần khi trời mưa) | |

  Áo và quần thay được trên người Anh. Giày dép có thể làm đơn giản (đổi màu, đổi dáng thấp).
- **Ánh sáng:** "bake" sẵn vào texture trong Blender, hạn chế đèn và bóng tính trực tiếp lúc chơi.

## 7. Công nghệ (**[Claude chọn]**, đã trình bày với tác giả và tác giả không phản đối)

- **Vite + TypeScript + Three.js** thông qua **React Three Fiber** (và bộ tiện ích drei).
- Vật lý và lái xe: **Rapier** (`@react-three/rapier`). Xe lái theo kiểu game cho vui, không cần giống mô phỏng thật.
- Giao diện (đồng hồ, danh sách việc, màn chat, tủ đồ, bảng "?", màn kết thúc) viết bằng React đè lên khung 3D.
- Mô hình xuất từ Blender ra `.glb`, nén hình khối (Draco hoặc Meshopt) và nén texture (KTX2).
- Đưa lên **GitHub Pages** qua GitHub Actions: mỗi lần push lên `main` là có bản chơi thử mới.

## 8. Hiệu năng (tác giả yêu cầu: tối ưu kỹ để đa số mọi người chơi được)

**Thiết bị phải chơi được** (**[Claude chọn]** mốc cụ thể):
- Điện thoại Android phổ thông đời khoảng 4–5 năm trước, RAM 3 GB.
- iPhone chạy iOS 15 trở lên.
- Laptop văn phòng dùng card đồ họa tích hợp.
- Trình duyệt phải có WebGL2; máy không có thì hiện thông báo thân thiện thay vì màn hình trắng.

**Ngân sách** (**[Claude chọn]**):
- Lần tải đầu tối đa khoảng 8 MB; tổng cả game tối đa khoảng 20 MB. Phòng trọ tải trước để vào chơi ngay, bản đồ đường phố tải ngầm trong lúc chơi Màn 1–2.
- Trên điện thoại: dưới 100 lệnh vẽ mỗi khung hình, texture tối đa 1024 px (mức Thấp 512 px), giới hạn độ phân giải hiển thị (mức Thấp 1x, Vừa tối đa 1.5x).
- 60 khung hình/giây trên máy tính; từ 30 khung hình/giây trở lên trên các điện thoại ở trên.
- Không có bóng đổ tính trực tiếp ở mức Thấp; ánh sáng đã bake sẵn.

**Tự động chọn mức đồ họa** (**[Claude chọn]**): game đoán mức Thấp / Vừa / Cao theo thiết bị lúc mở, tự hạ một mức nếu khung hình tụt lâu, và người chơi vẫn chỉnh tay được.

**Cách kiểm tra:**
- Tác giả mở từng bản mới trên iPhone 13 và duyệt cả hình ảnh lẫn cảm giác điều khiển.
- Claude giả lập máy yếu bằng công cụ của Chrome (giảm tốc CPU, thu nhỏ màn hình) trước khi push.
- Có bảng đo khung hình/giây ẩn, bật bằng cách thêm `?debug` vào đường link, để tác giả hoặc bạn bè gửi số đo từ máy khác.

## 9. Thứ tự làm (**[Claude chọn]**)

Lượt nào cũng đưa lên được bản chơi thử để tác giả mở trên iPhone 13:

1. Khung dự án và đưa lên GitHub Pages; một phòng hộp xám đúng bố cục để đi lại thử bằng bàn phím và cảm ứng; nút "?"; bảng đo `?debug`.
2. Màn 1 và Màn 2 chơi được đủ (báo thức, 6 việc, các trò chơi nhỏ, chat), đồ vật vẫn là hình tạm.
3. Lái xe, bản đồ, Màn 3 đến Màn 5.
4. Kết thúc, chấm điểm, thẻ chia sẻ, bộ sưu tập kết thúc.
5. Hình ảnh thật (phòng, xe, nhân vật, tủ đồ), âm thanh, tối ưu theo ngân sách ở mục 8, rồi phát hành.

## 10. Để người làm game tự quyết

- Tốc độ đồng hồ, độ khó và cân bằng điểm, ngưỡng của từng kết thúc.
- Chi tiết từng trò chơi nhỏ, nội dung tin nhắn và các câu thoại hài.
- Bố cục bản đồ, vị trí hẻm tắt, vật cản giao thông.
- Kích thước phòng (ước lượng từ ảnh, gạch lát sàn khoảng 60 cm).
- Cấu trúc code, cách quản lý trạng thái, cách lưu file `.blend` trong repo.
- Chọn mẫu nhân vật và nguồn âm thanh cụ thể (miễn là miễn phí bản quyền và ghi công nếu giấy phép yêu cầu).
