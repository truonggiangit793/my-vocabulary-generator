# IELTS Vocabulary Anki Text Generator Agent

Tài liệu này là đặc tả bắt buộc cho Agent khi chuyển đổi danh sách từ vựng trong `/input` thành hai loại bài tập text tab-separated (TSV) để import vào Anki:

- Choice Question: câu hỏi trắc nghiệm, lưu trong thư mục nhóm tương ứng dưới `/output`.
- Fill The Blank: câu hỏi điền từ, lưu cùng thư mục nhóm với Choice Question tương ứng dưới `/output`.

Agent phải ưu tiên độ chính xác ngữ nghĩa, tính nhất quán định dạng text tab-separated và khả năng import dữ liệu ổn định vào Anki.

---

## 1. Directory Structure

```text
.
├── AGENTS.MD
├── input/
├── output/
├── images/
└── tools/
```

### `AGENTS.MD`

Chứa quy tắc hoạt động, định dạng input, định dạng output, và checklist kiểm tra chất lượng.

### `input/`

Chứa các file `.txt` đầu vào. Mỗi file tương ứng với một passage/test và sẽ tạo ra hai file `.txt` cùng stem trong thư mục output.

Ví dụ file:

```text
nocturnal = night-active, after-dark, nighttime
critically = dangerously, seriously, severely
endangered = highly threatened, on the brink of extinction, scarce
unique = unusual, uncommon, distinctive
forward-facing = facing ahead, oriented to the front #backward-facing
```

Quy tắc đọc mỗi dòng:

- Mỗi dòng hợp lệ có dạng `word = meaning/synonyms`.
- Phần bên trái dấu `=` là từ hoặc cụm từ đích.
- Phần bên phải là gợi ý nghĩa, định nghĩa, từ đồng nghĩa, hoặc cụm giải thích.
- Nếu có ký tự `#`, phần sau `#` là gợi ý từ trái nghĩa hoặc distractor cần tránh/ưu tiên theo ngữ cảnh.
- Bỏ qua dòng trống.
- Giữ nguyên chính tả đặc biệt của từ gốc nếu có, ví dụ `kākāpō`, `forest-dwelling`.
- Nếu một từ lặp lại trong cùng file input, chỉ tạo một bộ câu hỏi cho lần xuất hiện đầu tiên, trừ khi ngữ nghĩa khác rõ ràng.

### `output/`

Chứa toàn bộ file text tab-separated đầu ra, được nhóm theo thư mục con tương ứng với thư mục của file input. Mỗi thư mục nhóm chứa cả Choice Question và Fill The Blank.

Tên file Choice Question dùng tiền tố `CHOICE-`, còn file Fill The Blank dùng tiền tố `FILL-` trước stem của input:

```text
input/cam20/CAM20-TEST1-PASSAGE1.txt
output/cam20/CHOICE-CAM20-TEST1-PASSAGE1.txt
output/cam20/FILL-CAM20-TEST1-PASSAGE1.txt
```

---

## 2. General Generation Workflow

Với mỗi file trong `/input`, Agent thực hiện theo thứ tự:

1. Đọc toàn bộ từ vựng trong file input.
2. Chuẩn hóa danh sách từ:
   - Loại dòng trống.
   - Tách `word`, `meaning/synonyms`, và optional note sau `#`.
   - Chuẩn hóa dạng nguyên mẫu theo quy tắc ở mục 2.1 trước khi tạo output.
   - Xác định loại từ chính: noun, verb, adjective, adverb, phrase, phrasal verb, idiom.
3. Thu thập metadata cho từng từ:
   - Word display.
   - Part of speech.
   - IPA UK và IPA US.
   - CEFR.
   - English definition.
   - Vietnamese meaning.
   - Image filename (để trống cho đến khi ảnh được kiểm tra theo quy tắc ở mục 4.1).
   - Example sentence (câu ví dụ tự nhiên, gần gũi, dùng được trong đời sống hàng ngày).
   - Vietnamese translation of the example sentence.
   - Synonym list (tìm các từ đồng nghĩa phù hợp, kèm nghĩa tiếng Việt).
   - Opposite list (tìm các từ trái nghĩa phù hợp, kèm nghĩa tiếng Việt).
4. Tạo Choice Question:
    - Mỗi từ tạo đúng 1 câu: English Definition.
5. Tạo Fill The Blank:
   - Mỗi từ tạo ít nhất 1 câu điền từ.
6. Đánh số liên tục:
   - Khi tạo output mới, Choice Question bắt đầu từ `1` và Fill The Blank tiếp tục sau số cuối cùng của Choice Question.
   - Khi bổ sung vào danh sách đã tạo, áp dụng quy tắc đánh số riêng tại mục 2.2; không đánh số lại các record cũ.
7. Xuất file `.txt` tab-separated đúng số cột, đúng thứ tự cột, không thêm cột ngoài quy định.
8. Kiểm tra lại file text trước khi hoàn tất.

### 2.1 Quy Tắc Chuẩn Hóa Nguyên Mẫu Trước Khi Tạo

Áp dụng các quy tắc này trong bước chuẩn hóa danh sách từ, trước khi thu thập metadata và tạo file text đầu ra:

- Nếu từ vựng là danh từ số nhiều có quy tắc, thường chỉ thêm `s` hoặc `es`, chuyển về dạng nguyên mẫu số ít trong file input tương ứng trước khi tạo danh sách.
- Nếu từ vựng là danh từ số nhiều bất quy tắc, ví dụ `men` là số nhiều của `man`, `women` là số nhiều của `woman`, `knives` là số nhiều của `knife`, cần bổ sung từ gốc vào file input tương ứng trước khi tạo danh sách.
- Với danh từ số nhiều bất quy tắc, English Definition phải giải thích rõ quan hệ giữa dạng số nhiều ban đầu và từ gốc, ví dụ nêu rằng `men` is the plural form of `man`.
- Nếu từ vựng là động từ quá khứ có quy tắc được thêm `-ed`, chuyển về dạng nguyên mẫu trong file input tương ứng trước khi tạo danh sách.
- Nếu từ vựng là động từ bất quy tắc, ví dụ `found` là quá khứ của `find`, cần bổ sung từ gốc vào file input tương ứng trước khi tạo danh sách.
- Với động từ bất quy tắc, English Definition phải giải thích rõ quan hệ giữa dạng quá khứ ban đầu và từ gốc, ví dụ nêu rằng `found` can be the past tense of `find` khi đúng ngữ cảnh input.
- Nếu từ vựng là tính từ dạng `-ed` hoặc `-ing`, ví dụ `interested`, `interesting`, giữ nguyên dạng từ trong file input và không chuyển về động từ gốc.
- Khi một dạng biến đổi có thể thuộc nhiều loại từ hoặc nhiều nghĩa, Agent phải dựa vào nghĩa/gợi ý bên phải dấu `=` và ngữ cảnh IELTS để quyết định có chuyển về nguyên mẫu hay giữ nguyên.

### 2.2 Workflow Khi Bổ Sung Từ Vựng Vào Danh Sách Đã Tạo

Chỉ áp dụng mục này khi người dùng yêu cầu bổ sung thêm từ vựng vào một danh sách/file đã được tạo trước đó. Khi đó Agent không đánh số lại toàn bộ file và không tạo lại danh sách từ đầu, mà thực hiện theo thứ tự:

1. Xác định file input tương ứng trong `/input` và thư mục nhóm tương ứng trong `/output`; trong đó có file `CHOICE-{INPUT_FILE_STEM}.txt` và file `FILL-{INPUT_FILE_STEM}.txt`.
2. Áp dụng quy tắc chuẩn hóa nguyên mẫu ở mục 2.1 cho từ vựng được yêu cầu trước khi append vào file input.
3. Bổ sung từ vựng được yêu cầu vào cuối file input tương ứng theo đúng format:
   ```text
   word = meaning/synonyms
   ```
   Nếu người dùng cung cấp gợi ý trái nghĩa hoặc distractor, ghi sau ký tự `#` theo quy tắc input hiện có.
4. Kiểm tra số thứ tự cuối cùng hiện có trong file Choice Question tương ứng.
5. Kiểm tra số thứ tự cuối cùng hiện có trong file Fill The Blank tương ứng.
6. Tạo đầy đủ bản ghi mới cho từ được bổ sung ở cả hai dạng:
   - 1 bản ghi Choice Question.
   - Ít nhất 1 bản ghi Fill The Blank.
7. Đánh số cho bản ghi Choice Question mới theo quy tắc nối chuỗi từ số cuối cùng của danh sách Choice Question:
   - Nếu số cuối cùng là `65-CAM18-TEST2-PASSAGE1`, số mới là `65+1-CAM18-TEST2-PASSAGE1`.
   - Nếu số cuối cùng là `65+10-CAM18-TEST2-PASSAGE1`, số mới là `65+11-CAM18-TEST2-PASSAGE1`.
   - Phần sau dấu `-` luôn giữ nguyên `INPUT_FILE_STEM`.
   - Chỉ tăng phần số sau dấu `+` nếu số cuối cùng đã có dạng bổ sung.
8. Đánh số cho bản ghi Fill The Blank mới bằng cách tiếp tục tăng số nguyên cuối cùng hiện có:
   - Nếu số cuối cùng là `130-CAM18-TEST2-PASSAGE1`, số mới là `131-CAM18-TEST2-PASSAGE1`.
   - Không dùng dạng nối chuỗi `+` cho Fill The Blank.
9. Append bản ghi mới vào cuối các file text tab-separated tương ứng, giữ nguyên các dòng đã có và không thay đổi số thứ tự cũ.
10. Kiểm tra lại rằng từ mới đã xuất hiện đầy đủ trong file input, Choice Question, và Fill The Blank tương ứng.

### 2.3 Đồng Bộ Tools Khi Thay Đổi Yêu Cầu

Mỗi khi người dùng chỉnh sửa một yêu cầu, Agent phải rà soát các script trong `/tools` trước khi thực hiện workflow tiếp theo:

1. Xác định script nào chịu ảnh hưởng trực tiếp bởi yêu cầu mới.
2. Cập nhật script, option, comment hoặc file cấu hình liên quan nếu cần để hành vi thực tế khớp với đặc tả mới.
3. Không thay đổi tool không liên quan.
4. Kiểm tra cú pháp và chạy kiểm tra an toàn, phù hợp với tool đã sửa, trước khi dùng tool đó trên dữ liệu thật.
5. Báo cáo rõ tool nào đã được cập nhật, hoặc xác nhận không có tool nào cần đổi khi yêu cầu chỉ ảnh hưởng tài liệu/dữ liệu.

---

## 3. Vocabulary Metadata Rules

### Source Priority

Khi xác định định nghĩa, IPA, và loại từ, ưu tiên nguồn theo thứ tự:

1. Cambridge Dictionary.
2. Oxford Learner's Dictionaries.
3. Merriam-Webster hoặc nguồn từ điển uy tín khác.
4. Tự paraphrase theo nghĩa chuẩn nếu không tìm được nguồn phù hợp.

### English Definition

Yêu cầu:

- Ngắn gọn, tự nhiên, dễ hiểu.
- Viết hoa chữ cái đầu.
- Phải có chấm cuối câu.
- Phù hợp đúng nghĩa của từ trong input.
- Không dùng chính từ đích trong definition nếu có thể tránh.
- Chỉ diễn đạt một nghĩa chính để tránh nhiều đáp án đúng.

### Vietnamese Meaning

Yêu cầu:

- Ngắn gọn, tự nhiên, đúng ngữ cảnh IELTS.
- Viết hoa chữ cái đầu.
- Phải có chấm cuối câu.
- Có thể là cụm danh từ, cụm động từ, hoặc câu giải thích ngắn.
- Chỉ diễn đạt một nghĩa chính để tránh nhiều đáp án đúng.

### IPA

Yêu cầu:

- Sử dụng IPA chuẩn quốc tế.
- Ưu tiên Cambridge cho UK/US IPA.
- Nếu UK và US giống nhau, vẫn điền cả hai ô.
- Nếu không tìm được IPA đáng tin cậy cho tên riêng/thuật ngữ hiếm, tự ước lượng cẩn thận và giữ nhất quán.

### CEFR

Giá trị hợp lệ:

```text
A1
A2
B1
B2
C1
C2
```

Nếu từ không có CEFR chính thức, Agent tự gán theo độ khó tương đối:

- A1-A2: từ phổ thông, cơ bản.
- B1-B2: từ học thuật hoặc thường gặp trong IELTS.
- C1-C2: từ chuyên biệt, hiếm, hoặc học thuật nâng cao.

---

## 4. Anki Text (TSV) Rules

### General Text Requirements

- Dữ liệu file output bắt buộc phải là TSV (Tab-Separated Values) và dùng đuôi `.txt`, tương tự các file Cam19 và Cam20. Không tạo hoặc duy trì output ở định dạng `.csv` hay định dạng khác.
- Nếu file output đã tồn tại trước đó ở định dạng khác, bắt buộc chuyển đổi file đó về TSV `.txt` trước khi tiếp tục xử lý. Việc chuyển đổi phải giữ nguyên toàn bộ nội dung dữ liệu, số record, thứ tự cột và format các cột theo quy định; chỉ thay đổi định dạng lưu trữ/delimiter cần thiết và phần mở rộng sang `.txt`, không chỉnh sửa nội dung bất kỳ field nào.
- File output `.txt` không bắt buộc có header. Khi tạo mới, không thêm header để nhất quán với các file hiện có.
- Mỗi record nằm trên đúng một dòng text.
- Dùng ký tự tab thực (`U+0009`, `\t`) làm delimiter giữa các cột; không dùng dấu phẩy làm delimiter.
- Dấu phẩy và dấu ngoặc kép là nội dung thông thường trong field, không cần quote hoặc escape theo quy tắc CSV.
- Không dùng ký tự tab hoặc line break bên trong một field. Nếu nội dung nguồn có tab hoặc xuống dòng, thay bằng một khoảng trắng trước khi xuất.
- Không để thừa hoặc thiếu cột.
- Không thêm Markdown trong file output.
- Encoding: UTF-8.

### 4.1 Image Asset Requirements

Ảnh là dữ liệu hỗ trợ ghi nhớ, không phải trường bắt buộc. Chỉ điền cột `image` khi một ảnh có thể minh hoạ **đúng nghĩa đang được kiểm tra**. Nếu không có ảnh phù hợp, để trống cột này ở cả Choice Question và Fill The Blank.

#### 4.1.0 Đồng bộ ảnh giữa Choice Question và Fill The Blank

- Khi người dùng chỉ yêu cầu **đồng bộ hình ảnh**, Agent chỉ được đối chiếu và đồng bộ các tham chiếu ảnh hiện có giữa Choice và Fill. Không được thực hiện Google Images, tìm kiếm nguồn ảnh, tải ảnh mới, chuyển đổi ảnh hoặc thay đổi nội dung ảnh trong `/images`.
- Trong cùng một thư mục nhóm, record Choice và record Fill tương ứng phải dùng cùng một local filename hợp lệ ở cột `image` khi chúng có cùng từ/cụm từ đích và cùng nghĩa. “Cùng nghĩa” được hiểu theo ngữ nghĩa trong ngữ cảnh, không yêu cầu chuỗi `definition` hoặc `vietnamese` giống hệt nhau; phải đối chiếu definition, nghĩa tiếng Việt, part of speech và example sentence.
- Phải kiểm tra đồng bộ hai chiều: nếu một bên có local filename hợp lệ còn bên kia để trống, chứa Remote URL hoặc giá trị local không hợp lệ, copy chính xác filename đó sang bên còn thiếu. Không tải thêm ảnh và không tạo filename khác cho cùng record.
- Nếu cả hai bên chưa có ảnh hợp lệ, giữ nguyên cả hai ô trống/không hợp lệ và ghi nhận là chưa có ảnh để đồng bộ; không tìm hoặc tải ảnh mới trong chế độ đồng bộ.
- Nếu cả hai bên đã có cùng local filename hợp lệ, giữ nguyên và coi là đã đồng bộ.
- Nếu hai bên đang có hai local filename hợp lệ khác nhau, không được tự ý đổi tên, ghi đè tham chiếu hoặc xoá filename nào. Giữ nguyên cả hai, ghi nhận xung đột để xử lý thủ công; chỉ kết luận đồng bộ hoàn tất sau khi xung đột được giải quyết mà vẫn không đổi tên các filename đã tồn tại.
- Không đồng bộ chỉ vì cùng spelling khi `definition` hoặc ngữ cảnh chỉ có liên quan lỏng lẻo; các nghĩa khác nhau phải được đối chiếu riêng. Các cách diễn đạt lại, nghĩa có phần giao nhau, hoặc nghĩa rộng/hẹp nhưng vẫn có cùng ý nghĩa cốt lõi có thể được xem là tương đồng nếu cùng một ảnh minh họa được cho cả hai record mà không gây hiểu nhầm.
- `sync_image_references.mjs` dùng khóa văn bản chính xác như một cơ chế an toàn và không tự suy luận tương đương ngữ nghĩa. Nếu Choice và Fill diễn đạt khác nhau nhưng Agent đã xác nhận là cùng nghĩa/tương đồng nghĩa, Agent phải đối chiếu thủ công trước khi đồng bộ; không được coi việc tool không tìm thấy khóa giống hệt là bằng chứng hai record khác nghĩa.

### 4.1.1 Quy trình Google Search khi tạo mới hoặc cập nhật output

Áp dụng quy trình này khi người dùng yêu cầu tạo dữ liệu output mới hoặc cập nhật hình ảnh cho output đã có. Với output mới, thực hiện quy trình từ đầu cho từng record; với output đã có, bắt đầu bằng việc kiểm tra giá trị hiện tại trong cột `image`:

**Nguyên tắc bất biến filename:** Khi người dùng yêu cầu cập nhật, làm mới hoặc đồng bộ hình ảnh, mọi giá trị `image` đang là local filename hợp lệ phải được giữ nguyên tuyệt đối. Agent/tool chỉ được thay đổi nội dung ảnh tại đúng filename hiện có; không được đổi tên, chuẩn hoá lại slug, thêm/bớt index, đổi phần mở rộng, hoặc thay filename trong TSV. Chỉ được tạo và gán filename mới cho record chưa có local filename hợp lệ (ô trống hoặc Remote URL đang được chuyển đổi). Nếu phát hiện xung đột nghĩa nhưng filename local hợp lệ đã tồn tại, giữ nguyên filename đó và báo cáo xung đột; không giải quyết bằng cách đổi tên file.

Trước khi xử lý từng record, xác định record đó có thể minh hoạ ổn định theo mục Quy trình chọn ảnh hay không. Với cụm từ dài khoảng 3 từ trở lên hoặc thành ngữ mang ý nghĩa trừu tượng, để trống `image` và bỏ qua toàn bộ bước Remote URL, tái sử dụng ảnh và tìm ảnh mới.

Toàn bộ quy trình tìm, xem trước, chọn và lưu ảnh phải thực hiện thủ công bằng Google Search/Google Images trong Browser. Không dùng script tải ảnh, API nguồn ảnh, nguồn fallback tự động hoặc tool tự động thay ảnh. Nếu yêu cầu chỉ là đồng bộ, chỉ đối chiếu local filename giữa Choice và Fill rồi dừng.

1. Kiểm tra tuần tự các record và cột `image` từ trên xuống dưới. Nếu cột `image` đã chứa local filename hợp lệ, giữ nguyên filename đó trong mọi trường hợp. Nếu cột `image` chứa Remote URL hoặc giá trị không hợp lệ, không dùng tool tự động để chuyển đổi; phải kiểm tra lại nghĩa bằng Google Images, mở trang nguồn/ảnh gốc và xử lý thủ công trước khi cập nhật.
2. Trước khi tìm ảnh mới, đối chiếu record Choice và Fill tương ứng theo cùng từ/cụm từ và nghĩa. Nếu một bên có local filename hợp lệ còn bên kia chưa có filename hợp lệ, đồng bộ bằng cách copy chính xác filename hiện có sang bên kia. Không đổi filename đã tồn tại.
3. Nếu từ vựng chưa có hình ảnh ở cả hai dạng, chỉ kiểm tra các file output khác để tìm tên file ảnh dạng Local trước khi tìm ảnh mới. Tái sử dụng ảnh khi đồng thời trùng **từ vựng** và **nghĩa tương đồng trong ngữ cảnh**. Nghĩa tương đồng không yêu cầu `definition` hoặc `vietnamese` giống từng chữ: bao gồm paraphrase, cách diễn đạt rộng/hẹp, hoặc các định nghĩa có cùng ý nghĩa cốt lõi và cùng đối tượng minh họa. Ví dụ, `yield` với nghĩa “sản lượng cây trồng, lợi nhuận hoặc sản phẩm” có thể tái sử dụng ảnh của `yield` với nghĩa “tổng sản lượng của một vụ mùa” nếu ảnh thể hiện đúng ý nghĩa sản lượng và không gây hiểu nhầm. Không cần kiểm tra file vật lý tương ứng trong `/images` vì đây chỉ là thư mục tạm.
4. Khi đánh giá khả năng tái sử dụng từ output khác, phải phân loại kết quả thành: `semantic-match` (có thể tái sử dụng), `manual-review` (có phần giao nhau nhưng cần xem definition, example và ảnh trực quan), hoặc `not-match` (khác sense, khác đối tượng, khác part of speech hoặc ảnh có thể gây hiểu nhầm). Chỉ gắn filename tự động cho `semantic-match` rõ ràng; trường hợp `manual-review` phải báo cáo để kiểm tra thủ công trước khi cập nhật. Trong yêu cầu chỉ đồng bộ, giữ nguyên trạng thái hiện tại và không tìm/tải ảnh.
5. Nếu không có record có nghĩa tương đồng phù hợp, hoặc cả Choice và Fill tương ứng đều chưa có tên file ảnh dạng Local, mở Google Search/Google Images với truy vấn có từ, `definition`, part of speech và ngữ cảnh; chọn một ảnh gốc phù hợp rồi lưu thủ công và gắn cùng filename cho cả hai dạng.
6. Nếu trùng từ vựng nhưng là sense khác, không được dùng lại ảnh cũ cho record chưa có filename. Phải chọn ảnh Google khác phù hợp với nghĩa mới và chỉ gắn index tuần tự khi tạo filename mới cho record đó. Nếu record đã có local filename hợp lệ, giữ nguyên filename hiện có; không đổi sang filename có index khác.
7. Khi xử lý một từ vựng, phải thực hiện lần lượt: xem nghĩa; đối chiếu ảnh hợp lệ giữa Choice và Fill; kiểm tra output khác để phân loại mức độ tương đồng ngữ nghĩa; nếu là `semantic-match` thì có thể tái sử dụng, nếu là `manual-review` thì kiểm tra trực quan và ngữ cảnh trước khi quyết định, nếu không có thì tìm trên Google Images; xem trước và phân tích kỹ ảnh; mở trang nguồn hoặc ảnh gốc; sau đó mới lưu thủ công và cập nhật output.
8. Ảnh lưu thủ công bắt buộc là JPEG có đuôi `.jpg`, ưu tiên khung hình chiều ngang và có tỷ lệ tương đối thuộc một trong các tỷ lệ `3:4`, `3:2` hoặc `16:9`. Không gắn ảnh chỉ dựa trên tiêu đề, tag hoặc URL nếu chưa kiểm tra trực quan và đối chiếu nghĩa.

#### Nguồn và phương thức ảnh

Google Search/Google Images là nguồn và phương thức duy nhất cho toàn bộ quy trình liên quan tới ảnh. Không dùng Unsplash, Pinterest, Pexels, Pixabay, Openverse, Flickr, API nguồn ảnh hoặc script tải/thay ảnh tự động.

Nếu Google Search/Google Images không khả dụng, Agent phải dừng quy trình ảnh và hỏi người dùng; không tự động chuyển sang nguồn hoặc tool khác.

Sau khi kiểm tra khả năng tái sử dụng tên file Local từ các output khác, nếu cần tìm ảnh mới thì Agent **bắt buộc phải thực hiện Google Search / Google Images** cho từng từ/cụm từ cần ảnh. Phải lọc, xem trước, mở trang nguồn và phân tích ảnh được chọn trước khi lưu thủ công và gắn vào TSV.

#### Quy trình chọn ảnh

1. Đọc `definition` trước, sau đó đối chiếu `vietnamese`, part of speech và example sentence để xác định đúng nghĩa.
2. Không tìm ảnh chỉ dựa vào cách viết của từ. Với từ đa nghĩa, ảnh phải theo nghĩa trong bản ghi. Ví dụ, nếu definition của `bat` là dụng cụ đánh bóng thì ảnh phải là gậy bóng chày, không phải con dơi.
3. Chỉ dùng ảnh cho danh từ/cụm danh từ cụ thể, sinh vật, đồ vật, địa điểm, bộ phận cơ thể, hiện tượng có thể quan sát, hoặc hành động có bối cảnh rõ ràng.
4. Không dùng ảnh cho trạng từ, giới từ, cấu trúc ngữ pháp, thành ngữ mang ý nghĩa trừu tượng, quan hệ trừu tượng, khái niệm đánh giá hoặc cụm từ dài khoảng 3 từ trở lên mang ý nghĩa trừu tượng. Để trống trường ảnh trong các trường hợp này. Với từ/cụm từ đa nghĩa mà không có một minh hoạ ổn định, cũng để trống trường ảnh.
5. Với kết quả từ Google Search, lọc các ảnh theo nghĩa, `definition`, part of speech và ngữ cảnh; xem trước và phân tích kỹ từng ứng viên phù hợp trước khi chọn ảnh. Không chấp nhận ảnh chỉ liên quan lỏng lẻo qua tiêu đề, tag, hoặc một nghĩa khác của từ.

#### Yêu cầu chất lượng và lưu ảnh gốc thủ công

- Không được dùng ảnh thumbnail/ảnh xem trước của Google làm file ảnh cuối cùng. Các URL dạng `encrypted-tbn0.gstatic.com`, URL thumbnail, ảnh bị thu nhỏ trong trang kết quả hoặc ảnh chỉ có kích thước vài trăm pixel chỉ dùng để xem và đánh giá, không được tải trực tiếp vào `/images`.
- Sau khi chọn ứng viên trên Google Images, phải mở trang nguồn hoặc truy cập URL ảnh gốc để lưu thủ công phiên bản có độ phân giải cao hơn. Nếu không lấy được ảnh gốc, bỏ qua ứng viên đó và chọn ứng viên khác; không phóng to thumbnail bằng nội suy để giả lập ảnh chất lượng cao.
- Ảnh mới tải phải có cạnh dài tối thiểu khoảng `1200 px`; ưu tiên ảnh có chiều ngang từ `1600 px` trở lên và đủ chi tiết để nhìn rõ chủ thể khi hiển thị trên Anki. Ảnh dưới ngưỡng này chỉ được dùng khi không tồn tại ảnh phù hợp hơn và Agent phải ghi nhận ngoại lệ trong báo cáo.
- Sau khi tải, phải kiểm tra kích thước pixel thực tế, định dạng JPEG, độ rõ của chủ thể và tỷ lệ khung hình so với một trong các tỷ lệ `3:4`, `3:2` hoặc `16:9`.
- Không được tự ý crop/cắt, resize, kéo giãn, thêm padding hoặc thay đổi bố cục ảnh. Phải giữ nguyên ảnh gốc được tải về, bao gồm nội dung, bố cục và kích thước pixel; chỉ được chuyển đổi định dạng sang `.jpg` khi cần để đáp ứng yêu cầu JPEG.
- Nếu ảnh gốc không có tỷ lệ tương đối phù hợp, phải bỏ qua ảnh đó và chọn ứng viên khác; không được chỉnh sửa ảnh để ép về tỷ lệ yêu cầu.
- Khi người dùng yêu cầu nâng chất lượng ảnh, chỉ xử lý lại các ứng viên Google Search/Google Images được xác định trong lần xử lý hiện tại; không thay đổi các local filename hợp lệ đã có nếu người dùng không yêu cầu.

#### Yêu cầu tệp ảnh

- Định dạng bắt buộc: `.jpg` (JPEG). Tỷ lệ khung hình tương đối phải là `3:4`, `3:2` hoặc `16:9`; ưu tiên ảnh có chiều ngang.
- Chất lượng bắt buộc: không dùng thumbnail hoặc ảnh preview độ phân giải thấp; phải lưu ảnh gốc/ảnh độ phân giải cao đã kiểm tra, với cạnh dài tối thiểu khoảng `1200 px` và ưu tiên từ `1600 px` trở lên.
- Ảnh được lưu trực tiếp trong thư mục tạm `/images`, không tạo thư mục con.
- Tên tệp mới dùng lowercase kebab-case: `baseball-bat.jpg`, `coral-reef.jpg`. Khi cùng từ vựng có nhiều nghĩa và record chưa có local filename, thêm index tuần tự như `baseball-bat-2.jpg`. Giữ nguyên tuyệt đối tên local filename hợp lệ đã có trong TSV, kể cả khi filename không còn đúng quy tắc đặt tên mới.
- Cùng một nghĩa/từ phải dùng cùng một filename ở Choice và Fill. Không tạo hai ảnh khác nhau cho cùng bản ghi nếu không có lý do ngữ nghĩa rõ ràng.
- Không dùng ảnh có watermark che chủ thể, chữ đáp án, hoặc nội dung gây hiểu nhầm.

#### Kiểm tra sau khi xử lý ảnh

- Mỗi giá trị `image` không rỗng trong TSV phải là tên file ảnh dạng Local, không phải Remote URL. Không bắt buộc kiểm tra file vật lý tương ứng trong `/images` vì `/images` chỉ là thư mục tạm.
- Nếu tên file ảnh bị xoá hoặc thay thế khỏi dữ liệu output, phải làm trống hoặc cập nhật mọi record còn tham chiếu đến tên file đó.
- Khi cập nhật hoặc đồng bộ hình ảnh, không được đổi tên bất kỳ local filename hợp lệ nào đã tồn tại; chỉ được thay nội dung ảnh tại đúng filename đó hoặc bổ sung filename cho ô đang trống/Remote URL.
- Khi chỉ cập nhật hình ảnh cho output đã có, Choice vẫn có 19 cột và Fill vẫn có 14 cột; chỉ trường `image` được phép thay đổi. Quy tắc này không hạn chế việc tạo đầy đủ các field khi tạo output mới.
- Rà ngẫu nhiên và rà bắt buộc mọi từ đa nghĩa/rủi ro cao (ví dụ homonym, polysemy, idiom) bằng definition trước khi hoàn tất.

#### Tool hình ảnh

Dự án không còn bộ tool tải, thay, lọc hoặc lấy nguồn ảnh tự động. Toàn bộ việc tìm kiếm, xem trước, tải ảnh gốc, chuyển JPEG và cập nhật TSV phải thực hiện thủ công bằng Google Search/Google Images trong Browser.

`sync_image_references.mjs` là ngoại lệ chỉ dành cho yêu cầu đồng bộ local filename giữa Choice và Fill. Tool này không tìm, tải, đổi tên hoặc thay nội dung ảnh.

---

## 5. Choice Question Format

Mỗi record Choice Question phải có đúng 19 cột theo thứ tự:

```text
number	question	a	b	c	d	answers	word	type	ipa-uk	ipa-us	cerf	definition	vietnamese	image	example	eg-vie	synonym	opposite
```

### 5.1 `number`

Định dạng khi tạo output mới:

```text
{index}-{INPUT_FILE_STEM}
```

Ví dụ:

```text
1-CAM20-TEST1-PASSAGE1
2-CAM20-TEST1-PASSAGE1
3-CAM20-TEST1-PASSAGE1
```

Quy tắc:

- Bắt đầu từ `1` cho mỗi file input và tăng dần theo thứ tự record.
- Unique trong cùng file text.
- `INPUT_FILE_STEM` là tên file input không bao gồm `.txt`.
- Khi bổ sung vào file đã có, Choice Question dùng dạng `{last}+{N}-{INPUT_FILE_STEM}` theo mục 2.2, ví dụ `65+1-CAM18-TEST2-PASSAGE1`. Ký hiệu `+N` chỉ áp dụng cho record Choice Question được append.

### 5.2 `question`

Mỗi từ tạo đúng 1 câu hỏi: English Definition => Vocabulary.

Format:

```text
Definition.
```

Ví dụ:

```text
Active at night rather than during the day.
```

Yêu cầu:

- Definition viết bằng tiếng Anh.
- Viết hoa chữ cái đầu.
- Phải có chấm cuối câu.
- Ngắn gọn, chính xác.
- Chỉ có một đáp án đúng trong 4 lựa chọn.

### 5.3 Columns `a` to `d`

Quy tắc:

- Sử dụng `a`, `b`, `c`, `d` cho 4 lựa chọn.
- Viết lowercase toàn bộ.
- Không chấm cuối câu.
- Có đúng một đáp án đúng.
- Đáp án đúng phải là chính xác từ/cụm từ đích trong input.
- Các distractor phải là đáp án gây nhiễu hợp lý, không phải các từ khác biệt quá nổi bật khiến người học dễ loại bằng cảm tính.
- Distractor nên cùng loại từ với đáp án đúng nếu có thể.
- Distractor nên có độ dài, hình thức, mức độ học thuật, và độ khó tương đối gần với đáp án đúng.
- Ưu tiên distractor cùng chủ đề, cùng ngữ cảnh IELTS, hoặc gần trường nghĩa nhưng không đồng nghĩa hoàn toàn.
- Distractor cần đủ gần nghĩa để buộc người học hiểu definition, nhưng vẫn sai rõ khi xét chính xác định nghĩa.
- Nếu input có gợi ý sau `#`, có thể dùng làm distractor khi đó là từ trái nghĩa hoặc lựa chọn dễ nhầm phù hợp.
- Không chọn distractor khiến câu hỏi có nhiều hơn một đáp án đúng.
- Không dùng biến thể hình thái quá gần làm nhiễu nếu dễ gây mơ hồ, ví dụ đáp án là `criticise` thì tránh `critical` nếu câu hỏi không kiểm tra word family.
- Không dùng distractor quá lạc chủ đề, quá dễ nhận ra, hoặc khác loại từ rõ ràng, ví dụ đáp án là adjective nhưng distractor là noun/verb không liên quan.

Ví dụ distractor tốt:

```text
nocturnal, solitary, vulnerable, unattended
```

Ví dụ distractor kém:

```text
nocturnal, computer, happiness, run
```

### 5.4 `answers`

Giá trị hợp lệ:

```text
a
b
c
d
```

Quy tắc:

- Chỉ ghi tên cột chứa đáp án đúng.
- Không ghi nội dung từ vựng vào cột này.

### 5.5 `word`

Từ hoặc cụm từ đích, viết lowercase toàn bộ.

### 5.6 `type`

Giá trị là part of speech của từ vựng, viết bằng lowercase.

Ví dụ: `adjective`, `noun`, `verb`, `phrase`.

### 5.7 `ipa-uk`

IPA UK chuẩn, bao gồm cả dấu `/.../`.

Ví dụ: `/nɒkˈtɜː.nəl/`

### 5.8 `ipa-us`

IPA US chuẩn, bao gồm cả dấu `/.../`.

Ví dụ: `/nɑːkˈtɝː.nəl/`

### 5.9 `cerf`

Giá trị CEFR: A1, A2, B1, B2, C1, C2.

Ví dụ: `B2`

### 5.10 `definition`

Giá trị là English definition ngắn gọn, viết hoa chữ cái đầu.

Quy tắc:

- Không chứa dấu ngoặc kép hoặc xuống dòng, phải có chấm cuối câu.

### 5.11 `vietnamese`

Giá trị là nghĩa tiếng Việt ngắn gọn, tự nhiên, đúng ngữ cảnh IELTS.

Quy tắc:

- Không chứa dấu ngoặc kép hoặc xuống dòng, phải có chấm cuối câu.

### 5.12 `image`

Tên file ảnh dạng Local trong thư mục tạm `/images`; Remote URL không được giữ lại trong output sau khi xử lý thủ công bằng Google Search và phải được thay bằng tên file `.jpg`. Khi đối chiếu output khác, chỉ cần kiểm tra tên file dạng Local, không cần kiểm tra file vật lý trong `/images`.

Quy tắc:

- Để trống nếu không có ảnh phù hợp hoặc nếu từ/cụm từ thuộc nhóm không thể minh hoạ ổn định. Nếu có ảnh, ghi tên file Local `.jpg`; không ghi Remote URL trong output sau khi hoàn tất.

### 5.13 `example`

Câu ví dụ sử dụng từ vựng trong ngữ cảnh tự nhiên, gần gũi, dễ nhớ.

Quy tắc:

- Viết hoa chữ cái đầu.
- Câu ví dụ phải tự nhiên, gần gũi, có thể dùng được trong đời sống hàng ngày, không quá cao siêu hoặc chuyên ngành.
- Ngữ cảnh dễ nhớ, giúp người học liên tưởng đến nghĩa của từ.
- Không chứa dấu ngoặc kép hoặc xuống dòng.

### 5.14 `eg-vie`

Bản dịch tiếng Việt của câu ví dụ ở cột `example`.

Quy tắc:

- Dịch tự nhiên, sát nghĩa, phù hợp ngữ cảnh.
- Viết hoa chữ cái đầu.
- Không chứa dấu ngoặc kép hoặc xuống dòng.
- Phải có chấm cuối câu.

### 5.15 `synonym`

Danh sách từ đồng nghĩa của từ vựng.

Quy tắc:

- Các từ đồng nghĩa phù hợp, kèm nghĩa tiếng Việt.
- Định dạng: `word (nghĩa tiếng Việt), word (nghĩa tiếng Việt), ...`
- Mỗi từ kèm giải thích nghĩa tiếng Việt trong cặp dấu `()`.
- Nếu không có từ đồng nghĩa phù hợp, để trống cột này.
- Không chứa dấu ngoặc kép hoặc xuống dòng.
- Không chấm cuối câu.

### 5.16 `opposite`

Danh sách từ trái nghĩa của từ vựng.

Quy tắc:

- Các từ trái nghĩa phù hợp, kèm nghĩa tiếng Việt.
- Định dạng: `word (nghĩa tiếng Việt), word (nghĩa tiếng Việt), ...`
- Mỗi từ kèm giải thích nghĩa tiếng Việt trong cặp dấu `()`.
- Nếu không có từ trái nghĩa phù hợp, để trống cột này.
- Không chứa dấu ngoặc kép hoặc xuống dòng.
- Không chấm cuối câu.

---

## 6. Fill The Blank Format

Mỗi record Fill The Blank phải có đúng 14 cột theo thứ tự:

```text
number	question	answer	type	ipa-uk	ipa-us	cerf	definition	vietnamese	image	example	eg-vie	synonym	opposite
```

### 6.1 `number`

Định dạng giống Choice Question:

```text
{index}-{INPUT_FILE_STEM}
```

Quy tắc:

- Khi tạo output mới, không bắt đầu lại từ `1`; tiếp tục từ số cuối cùng của Choice Question trong cùng input. Ví dụ nếu Choice Question có 40 câu, Fill The Blank bắt đầu từ `41-{INPUT_FILE_STEM}`.
- Khi bổ sung vào danh sách đã có, tiếp tục tăng số nguyên từ số cuối cùng hiện có của file Fill The Blank, theo mục 2.2; không dùng dạng nối chuỗi `+`.

### 6.2 `question`

Format:

```text
Sentence with __ blank.
```

Ví dụ:

```text
Many desert animals are __ and become active after sunset.
```

Yêu cầu:

- Câu ví dụ phải tự nhiên và phù hợp ngữ cảnh IELTS.
- Viết hoa chữ cái đầu.
- Phải có chấm cuối câu.
- Mỗi `__` chỉ đại diện cho **1 từ**.
- Với cụm từ có nhiều từ, dùng số lượng `__` tương ứng với số từ trong cụm. Ví dụ `home range` → `__ __`, `account for` → `__ __`.
- Câu phải có đủ ngữ cảnh để suy ra một đáp án hợp lý.
- Không để lộ từ đích hoặc biến thể quá rõ của từ đích trong câu hỏi.
- Không tạo câu quá chung khiến nhiều đáp án khác nhau đều đúng.

### 6.3 `answer`

Quy tắc:

- Ghi đáp án đúng ở dạng lowercase.
- Giữ dấu gạch nối, khoảng trắng, và ký tự đặc biệt nếu thuộc từ gốc.
- Không chấm cuối câu.
- Với cụm từ, ghi đầy đủ cụm từ.

Ví dụ:

```text
nocturnal
home range
forest-dwelling
kākāpō
```

### 6.4 `type`

Giá trị là part of speech của từ vựng, viết bằng lowercase.

Ví dụ: `adjective`, `noun`, `verb`, `phrase`.

### 6.5 `ipa-uk`

IPA UK chuẩn, bao gồm cả dấu `/.../`.

Ví dụ: `/nɒkˈtɜː.nəl/`

### 6.6 `ipa-us`

IPA US chuẩn, bao gồm cả dấu `/.../`.

Ví dụ: `/nɑːkˈtɝː.nəl/`

### 6.7 `cerf`

Giá trị CEFR: A1, A2, B1, B2, C1, C2.

Ví dụ: `B2`

### 6.8 `definition`

Giá trị là English definition ngắn gọn, viết hoa chữ cái đầu.

Quy tắc:

- Không chứa dấu ngoặc kép hoặc xuống dòng, phải có chấm cuối câu.

### 6.9 `vietnamese`

Giá trị là nghĩa tiếng Việt ngắn gọn, tự nhiên, đúng ngữ cảnh IELTS.

Quy tắc:

- Không chứa dấu ngoặc kép hoặc xuống dòng, phải có chấm cuối câu.

### 6.10 `image`

Tên file ảnh dạng Local trong thư mục tạm `/images`; Remote URL không được giữ lại trong output sau khi xử lý thủ công bằng Google Search và phải được thay bằng tên file `.jpg`. Khi đối chiếu output khác, chỉ cần kiểm tra tên file dạng Local, không cần kiểm tra file vật lý trong `/images`.

Quy tắc:

- Để trống nếu không có ảnh phù hợp hoặc nếu từ/cụm từ thuộc nhóm không thể minh hoạ ổn định. Nếu có ảnh, ghi tên file Local `.jpg`; không ghi Remote URL trong output sau khi hoàn tất.

### 6.11 `example`

Câu ví dụ sử dụng từ vựng trong ngữ cảnh tự nhiên, gần gũi, dễ nhớ.

Quy tắc:

- Viết hoa chữ cái đầu.
- Phải có chấm cuối câu.
- Câu ví dụ phải tự nhiên, gần gũi, có thể dùng được trong đời sống hàng ngày, không quá cao siêu hoặc chuyên ngành.
- Ngữ cảnh dễ nhớ, giúp người học liên tưởng đến nghĩa của từ.
- Không chứa dấu ngoặc kép hoặc xuống dòng.

### 6.12 `eg-vie`

Bản dịch tiếng Việt của câu ví dụ ở cột `example`.

Quy tắc:

- Dịch tự nhiên, sát nghĩa, phù hợp ngữ cảnh.
- Viết hoa chữ cái đầu.
- Phải có chấm cuối câu.
- Không chứa dấu ngoặc kép hoặc xuống dòng.

### 6.13 `synonym`

Danh sách từ đồng nghĩa của từ vựng.

Quy tắc:

- Các từ đồng nghĩa phù hợp, kèm nghĩa tiếng Việt.
- Định dạng: `word (nghĩa tiếng Việt), word (nghĩa tiếng Việt), ...`
- Mỗi từ kèm giải thích nghĩa tiếng Việt trong cặp dấu `()`.
- Nếu không có từ đồng nghĩa phù hợp, để trống cột này.
- Không chấm cuối câu.
- Không chứa dấu ngoặc kép hoặc xuống dòng.

### 6.14 `opposite`

Danh sách từ trái nghĩa của từ vựng.

Quy tắc:

- Các từ trái nghĩa phù hợp, kèm nghĩa tiếng Việt.
- Định dạng: `word (nghĩa tiếng Việt), word (nghĩa tiếng Việt), ...`
- Mỗi từ kèm giải thích nghĩa tiếng Việt trong cặp dấu `()`.
- Nếu không có từ trái nghĩa phù hợp, để trống cột này.
- Không chấm cuối câu.
- Không chứa dấu ngoặc kép hoặc xuống dòng.

---

## 7. Question Count Rules

Với mỗi từ hợp lệ trong input:

- Tạo 1 Choice Question: English Definition => Vocabulary.
- Tạo ít nhất 1 Fill The Blank question.

Ví dụ input có 40 từ hợp lệ:

- Choice Question: 40 records.
- Fill The Blank: ít nhất 40 records, bắt đầu từ `41-{INPUT_FILE_STEM}`.

---

## 8. Output Example

### Choice Question Row

```text
1-CAM20-TEST1-PASSAGE1	Active at night rather than during the day.	solitary	plentiful	nocturnal	unattended	c	nocturnal	adjective	/nɒkˈtɜː.nəl/	/nɑːkˈtɝː.nəl/	B2	Active at night rather than during the day.	Hoạt động về đêm.		Many animals like owls are nocturnal and hunt at night.	Nhiều loài động vật như cú là loài hoạt động về đêm và săn mồi vào ban đêm.	night-active (hoạt động về đêm)	daytime (ban ngày)
```

### Fill The Blank Row

```text
41-CAM20-TEST1-PASSAGE1	Many animals that hunt after sunset are __.	nocturnal	adjective	/nɒkˈtɜː.nəl/	/nɑːkˈtɝː.nəl/	B2	Active at night rather than during the day.	Hoạt động về đêm.		Many animals like owls are nocturnal and hunt at night.	Nhiều loài động vật như cú là loài hoạt động về đêm và săn mồi vào ban đêm.	night-active (hoạt động về đêm)	daytime (ban ngày)
```

---

## 9. Quality Checklist

Trước khi kết thúc, Agent phải kiểm tra:

- Mỗi file Choice Question có tên `CHOICE-{INPUT_FILE_STEM}.txt` và mỗi file Fill The Blank có tên `FILL-{INPUT_FILE_STEM}.txt`.
- Toàn bộ file output là TSV `.txt`; nếu phát hiện file output ở định dạng khác, file đó đã được chuyển đổi sang `.txt` mà không thay đổi nội dung dữ liệu hoặc thứ tự cột.
- Choice Question có đúng 19 cột mỗi dòng.
- Fill The Blank có đúng 14 cột mỗi dòng.
- `answers` của Choice Question chỉ là `a`, `b`, `c`, hoặc `d`.
- `answer` của Fill The Blank là lowercase.
- Số thứ tự tăng dần và không trùng.
- Khi tạo output mới, Fill The Blank tiếp tục số thứ tự sau Choice Question; khi bổ sung vào danh sách đã có, số mới tiếp tục sau record Fill The Blank cuối cùng.
- Khi tạo output mới hoặc cập nhật hình ảnh, các record đã được kiểm tra tuần tự từ trên xuống dưới.
- Remote URL trong cột `image` đã được kiểm tra thủ công bằng Google Search/Google Images, lưu từ ảnh gốc, chuyển thành JPEG `.jpg` và thay bằng tên file cục bộ.
- Mọi local filename hợp lệ đã có trước khi cập nhật hoặc đồng bộ hình ảnh vẫn giữ nguyên 100%, không bị đổi slug, index, phần mở rộng hoặc giá trị trong TSV.
- Các record Choice/Fill tương ứng cùng từ và nghĩa đã được đối chiếu hai chiều và dùng chung một local filename hợp lệ; xung đột hai filename khác nhau đã được báo cáo, không tự ý đổi tên.
- Nếu yêu cầu chỉ đồng bộ, không có thao tác Google Images, tìm kiếm nguồn, tải mới, chuyển đổi hoặc thay nội dung ảnh; các cặp chưa có ảnh được giữ nguyên và ghi nhận.
- Với từ chưa có ảnh, đã kiểm tra các output khác để tái sử dụng theo đúng cả từ vựng và nghĩa trước khi tải ảnh mới.
- Từ vựng trùng nhưng khác nghĩa chỉ dùng filename riêng có index khi record cần ảnh mới; không đổi filename local hợp lệ đã tồn tại.
- Các cụm từ dài khoảng 3 từ trở lên hoặc thành ngữ mang ý nghĩa trừu tượng đã được để trống trường `image`, không tìm hoặc tải ảnh.
- Mọi giá trị `image` được gắn vào output là tên file Local có đuôi `.jpg`, đã được xem trước khi tải mới hoặc đã được xác nhận từ record ảnh được tái sử dụng, và có tỷ lệ tương đối `3:4`, `3:2` hoặc `16:9`; không yêu cầu file đó phải còn tồn tại trong `/images`.
- Mọi ảnh mới lưu thủ công từ Google đã được lấy từ ảnh gốc thay vì thumbnail, có cạnh dài tối thiểu khoảng `1200 px` hoặc có ngoại lệ được ghi nhận, giữ nguyên nội dung/bố cục/kích thước pixel gốc và không bị mờ/vỡ sau khi chuyển sang JPEG.
- Trước khi tạo output, danh từ số nhiều có quy tắc và động từ quá khứ có quy tắc đã được chuyển về dạng nguyên mẫu trong file input tương ứng.
- Trước khi tạo output, danh từ số nhiều bất quy tắc và động từ bất quy tắc đã được bổ sung từ gốc vào file input tương ứng.
- Definition của các từ gốc được bổ sung từ dạng bất quy tắc phải giải thích rõ quan hệ với dạng biến đổi ban đầu.
- Tính từ dạng `-ed` hoặc `-ing` được giữ nguyên, không bị chuyển nhầm về động từ gốc.
- Khi bổ sung từ vào danh sách đã có, Choice Question mới dùng đúng dạng nối chuỗi `last+N-{INPUT_FILE_STEM}` theo số cuối cùng hiện có.
- Khi bổ sung từ vào danh sách đã có, Fill The Blank mới tiếp tục tăng số nguyên từ số cuối cùng hiện có.
- Khi bổ sung từ vào danh sách đã có, từ mới phải được append đầy đủ vào file input và cả hai file output tương ứng.
- Mỗi từ có đúng 1 câu hỏi Choice Question (English Definition).
- Mỗi câu hỏi chỉ có một đáp án đúng.
- Distractor không trùng đáp án đúng và không gây nhập nhằng.
- Mọi record được ngăn cách bằng line break, mọi field được ngăn cách bằng đúng một ký tự tab, và không field nào chứa tab hoặc line break.
- Kiểm tra dấu chấm câu tương ứng theo yêu cầu.
- Không có dòng rỗng ngoài ý muốn ở cuối file nếu hệ thống import không yêu cầu.

---

## 10. Common Mistakes To Avoid

- Không ghi đáp án đúng dạng từ vựng vào cột `answers` của Choice Question.
- Không dùng nhiều hơn 4 lựa chọn.
- Không để definition quá rộng khiến nhiều lựa chọn đều đúng.
- Không dùng distractor khác loại từ nếu có lựa chọn tốt hơn.
- Không bỏ qua IPA UK/US.
- Không thêm header vào file text mới nếu muốn nhất quán với các file hiện có.
- Không xuất hoặc giữ file output ở dạng `.csv`; bắt buộc dùng file `.txt` với ký tự tab thực làm delimiter. Khi chuyển đổi file cũ, không được thay đổi nội dung field hoặc thứ tự cột.
- Không tìm ảnh mới trước khi kiểm tra Remote URL và ảnh có sẵn trong các output khác.
- Không chỉ đồng bộ ảnh từ Choice sang Fill hoặc từ Fill sang Choice; phải đối chiếu hai chiều theo cả từ và nghĩa.
- Không tải mới hình ảnh khi người dùng chỉ yêu cầu đồng bộ; chế độ này chỉ đối chiếu và đồng bộ filename local hiện có.
- Không coi hai record đã đồng bộ khi Choice và Fill còn hai local filename hợp lệ khác nhau; phải báo xung đột và không tự ý đổi tên filename.
- Không tái sử dụng ảnh chỉ vì trùng cách viết từ vựng; phải trùng cả nghĩa.
- Không áp dụng quy trình tìm hoặc tái sử dụng ảnh cho cụm từ dài khoảng 3 từ trở lên hoặc thành ngữ mang ý nghĩa trừu tượng; các trường hợp này phải để trống `image`.
- Không dùng cùng một ảnh cho các nghĩa khác nhau của cùng từ nếu chưa có xác nhận ảnh minh hoạ chính xác; trường hợp record chưa có local filename thì tải ảnh mới và thêm index vào tên file nếu cần. Không được đổi tên local filename hợp lệ đã tồn tại.
- Không gắn Remote URL trực tiếp vào output sau khi tạo hoặc cập nhật; phải mở Google Images, kiểm tra trực quan ảnh gốc, lưu thủ công, chuẩn hoá thành `.jpg` và dùng tên file cục bộ.
- Không dùng ảnh chưa xem trước, sai ngữ cảnh, không phải JPEG `.jpg`, hoặc không gần một trong các tỷ lệ `3:4`, `3:2`, `16:9`.
- Không tự ý crop/cắt, resize, kéo giãn, thêm padding hoặc thay đổi bố cục ảnh; nếu ảnh gốc không gần tỷ lệ yêu cầu thì phải chọn ảnh khác.
- Không lưu thumbnail Google, URL `encrypted-tbn0.gstatic.com`, ảnh preview vài trăm pixel, hoặc ảnh bị phóng to từ thumbnail làm ảnh cuối cùng; phải lấy ảnh gốc/độ phân giải cao và kiểm tra kích thước pixel trước khi cập nhật output.
- Không tạo bài trực tiếp từ danh từ số nhiều có quy tắc hoặc động từ quá khứ có quy tắc khi chúng cần được chuyển về nguyên mẫu trước.
- Không bỏ qua việc bổ sung từ gốc cho danh từ số nhiều bất quy tắc hoặc động từ bất quy tắc.
- Không chuyển tính từ dạng `-ed` hoặc `-ing` như `interested`, `interesting` về động từ gốc.
- Không đánh số lại toàn bộ file khi chỉ được yêu cầu bổ sung từ vựng vào danh sách đã tạo trước đó.
- Không quên thêm từ mới vào file input tương ứng khi bổ sung từ vựng.
- Không dùng kiểu đánh số `+` cho Fill The Blank khi bổ sung từ vựng.
- Không ghi sai tên cột `answer` thành `answers` trong Fill The Blank.
- Không bỏ sót cột `word`, `type`, `ipa-uk`, `ipa-us`, `cerf`, `definition`, `vietnamese`, `image`, `example`, `eg-vie`, `synonym`, `opposite` trong Choice Question.
- Không bỏ sót cột `type`, `ipa-uk`, `ipa-us`, `cerf`, `definition`, `vietnamese`, `image`, `example`, `eg-vie`, `synonym`, `opposite` trong Fill The Blank.
