# GSJ Content Studio — Sanity

## Mở CMS online

[Mở GSJ Content Studio](https://gsj-website-cms-i5m9t12o.sanity.studio/). Sanity có thể chuyển sang Dashboard của tổ chức GSJ rồi mở Studio bên trong; đây vẫn là cùng CMS.

Đăng nhập tài khoản Sanity đã được mời vào dự án. Không dùng tài khoản/mật khẩu Strapi cũ. CMS online và nội dung/ảnh được Sanity lưu trữ, không cần để máy này chạy. Website hiện vẫn chạy local tại http://localhost:8008/; việc chuyển CMS không tự triển khai website hay thay DNS tên miền.

## Sửa chữ, ảnh, menu

1. Chọn **Trang website**, rồi chọn trang cần sửa. Có 10 trang; hai URL Mentor dùng chung một nội dung.
2. Mở **Các phần trên trang** và chọn phần theo tiêu đề đang thấy trên website.
3. Chọn tab **Nội dung chữ**, mở mục theo nhãn, sửa **Nội dung hiển thị**. Có thể xuống dòng, không nhập HTML.
4. Đổi ảnh tại tab **Hình ảnh → Chọn / thay ảnh**: tải PNG, JPG, WebP hoặc GIF; sửa mô tả alt nếu cần. 65 ảnh hiện có đã được chuyển sang Sanity. Các logo SVG tĩnh được giữ làm dự phòng; có thể thay bằng ảnh raster.
5. Tab **Đường dẫn** sửa URL nút/menu, không sửa chữ nút (chữ nằm trong Nội dung chữ). Tab **SEO** của trang sửa tiêu đề/mô tả Google.
6. Sanity tự lưu thay đổi thành **bản nháp**. Bấm **Publish** để xuất bản. Tải lại website; CDN có thể mất một lúc ngắn để cập nhật.

Chọn **Logo, menu & chân trang** để sửa phần dùng chung cho mọi trang. Không cần sửa từng trang riêng. Nhãn, mã, slug và số mục được khóa trong giao diện để tránh sửa nhầm bố cục; đây là CMS chỉnh nội dung trong thiết kế hiện tại, không phải page builder.

Website chỉ đọc bản đã xuất bản. Bản nháp vẫn xem/sửa trong Studio sau đăng nhập; **chưa có chế độ xem bản nháp trực tiếp trên website qua link như bản Strapi cũ**. Không chia sẻ token đăng nhập hoặc tự đưa token vào frontend để mở preview.

## Free và tài khoản nhân sự

Dự án `GSJ Website CMS` (`i5m9t12o`), tổ chức `GSJ` (`ot59bsmz2`), dataset công khai `production`.

Sanity tự bật Growth Trial $0 trong 30 ngày khi tạo dự án. Trang Plan ghi rõ **tự chuyển về Free khi hết trial**. Chưa thêm thẻ hoặc chọn gói trả phí. Studio đã tắt Comments, Tasks, Releases và Scheduled Drafts/Publishing; không phụ thuộc tính năng thử nghiệm trả phí.

Theo bảng giá được kiểm tra ngày 31/10/2026, Free có 20 chỗ, 2 dataset công khai, 10.000 tài liệu, 100 GB tài sản, 100 GB băng thông/tháng, 1 triệu lượt API CDN và 250.000 lượt API/tháng. Hết hạn mức có thể bị giới hạn chức năng; không coi đây là dịch vụ không giới hạn. Kiểm tra Usage định kỳ và không tự bấm nâng gói.

Free chỉ có **Administrator** và **Viewer**, không có Editor. Trong Sanity Manage → dự án → Members, chủ tài khoản tự mời từng người. Viewer chỉ xem; người cần sửa phải được cấp Administrator, có quyền quản trị rộng. Chỉ mời nhân sự tin cậy, không chia sẻ tài khoản chủ. Chưa tự mời hoặc đổi quyền của ai.

Dataset dùng để chứa nội dung website công khai, không lưu hồ sơ nội bộ hay khách hàng. Ảnh dataset có URL công khai; không tải tài liệu/ảnh nhạy cảm vào đây. Form tư vấn, câu hỏi, ứng tuyển vẫn dùng Supabase, không chuyển dữ liệu form sang CMS.

## Chạy local cho lập trình viên

Node.js >=22.12 (máy này dùng 24.14). Tại thư mục dự án:

```powershell
npm install
npm --prefix studio ci
npm run dev
```

Nếu cần sửa giao diện/schema CMS, chạy terminal khác:

```powershell
npm run cms:sanity
```

Mở http://localhost:3333/. Studio local kết nối cùng dataset online, nên chỉnh sửa/publish tại đây **cũng ảnh hưởng dữ liệu thật**. Không cần chạy Studio local để nhân sự dùng CMS online.

Frontend chọn nhà cung cấp trong `cms-config.js`. Chỉ project ID/dataset/API version là công khai; không có khóa ghi trong frontend. Adapter dùng API CDN, `perspective=published`, loại trừ ID draft/version, không gửi cookie hay Authorization. Text dùng text node, URL được kiểm tra, lỗi CMS/ảnh có HTML/ảnh tĩnh dự phòng. Bỏ Publish không xóa HTML dự phòng; muốn gỡ hẳn một trang phải sửa mã/triển khai, không chỉ unpublish CMS.

Server local chỉ phục vụ trang, JS/CSS và ảnh được cho phép. `/admin` dẫn tới CMS online. Không dùng `serve .` ở gốc repo vì có backend và bản sao lưu.

## Triển khai Studio sau khi sửa schema

```powershell
cd studio
npm run login
npx sanity schemas validate
npm run deploy
```

Đăng nhập bằng tài khoản có quyền phù hợp; không đưa token CLI vào Git, code hoặc ảnh chụp. Deployment đã gắn app ID `es34iq98mxc9m3iktz07mwnb`; lệnh cập nhật cùng Studio, không tạo thêm dự án/gói trả phí. Chỉ cấu hình CORS cho đúng origin cần dùng; credential chỉ dành cho Studio, không bật wildcard.

## Bản sao lưu và Strapi dự phòng

`cms/`, `cms/.env`, `cms/.tmp/data.db` và `cms/public/uploads/` vẫn được giữ nguyên. Bản sao SQLite/uploads cùng snapshot website/ảnh trước di chuyển nằm trong `artifacts/sanity-migration/` trên **máy này**, bị loại khỏi Git. Đã chuyển 10 bản trang đã publish + 10 bản nháp, 1 cấu hình đã publish + 1 bản nháp và 65 ảnh. Không chuyển admin users, mật khẩu, API secrets hoặc form khách hàng.

Từ khi chuyển, sửa trong Sanity **không đồng bộ ngược** vào Strapi hoặc HTML fallback. Quay về Strapi sẽ không hiển thị các chỉnh sửa Sanity mới nếu chưa di chuyển ngược. Chỉ rollback khi đã sao lưu/đối chiếu dữ liệu mới:

1. Chạy `npm run cms:strapi`.
2. Đổi `GSJ_CMS_PROVIDER` về `strapi` trong `cms-config.js`, giữ `GSJ_CMS_URL = "http://localhost:1337"`.
3. Mở http://localhost:1337/admin trực tiếp; `/admin` mặc định vẫn dẫn Sanity.

Xem `CMS-STRAPI-GUIDE.md` cho bản cũ. Không xóa database/uploads hoặc chạy seed/import để ghi đè nội dung nhân sự.

Để sao lưu Sanity, đăng nhập CLI rồi dùng `sanity datasets export production <đường dẫn .tar.gz ngoài repo hoặc trong artifacts/>`. Backup định kỳ cả nội dung lẫn assets, lưu thêm bản ngoài máy. Git chỉ giữ code/schema, không phải bản sao dữ liệu CMS.

## Kiểm tra

```powershell
npm run check
npm --prefix studio run build
npm --prefix studio audit --omit=dev
```

Kiểm tra kết nối đọc thật (dùng snapshot migration đã xuất):

```powershell
node scripts/check-sanity-live.mjs "<đường dẫn website.json>" --allow-content-edits
```

Lệnh này không ghi dữ liệu: kiểm tra mapping, CDN ảnh, hash/kích thước ảnh gốc, CORS, cách ly nháp. `--allow-content-edits` giữ/ghi nhận chữ/SEO nhân sự sửa sau khi nhập; bỏ cờ để so sánh chữ chính xác với snapshot.

`studio/scripts/check-workflow.mjs` cần chạy qua `sanity exec --with-user-token`; tạo tài liệu thử UUID riêng, thử draft/publish/unpublish/chặn ghi anonymous rồi xóa đúng tài liệu thử. Không sửa trang thật và không gửi form. Các kiểm tra Strapi cũ vẫn được giữ cho rollback.

Nguồn: [Sanity pricing](https://www.sanity.io/pricing), [Studio hosting](https://www.sanity.io/docs/studio/deployment), [Perspectives](https://www.sanity.io/docs/content-lake/perspectives), [Image CDN](https://www.sanity.io/docs/content-lake/image-urls).
