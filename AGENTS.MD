# IELTS Vocabulary CSV Generator Agent

Tài liệu này là đặc tả bắt buộc cho Agent khi chuyển đổi danh sách từ vựng trong `/input` thành hai loại bài tập CSV:

- Choice Question: câu hỏi trắc nghiệm, lưu trong thư mục nhóm tương ứng dưới `/output`.
- Fill The Blank: câu hỏi điền từ, lưu cùng thư mục nhóm với Choice Question tương ứng dưới `/output`.

Agent phải ưu tiên độ chính xác ngữ nghĩa, tính nhất quán định dạng CSV, và khả năng import dữ liệu ổn định vào hệ thống học từ vựng.

---

## 1. Directory Structure

```text
.
├── AGENTS.MD
├── input/
└── output/
```

### `AGENTS.MD`

Chứa quy tắc hoạt động, định dạng input, định dạng output, và checklist kiểm tra chất lượng.

### `input/`

Chứa các file `.txt` đầu vào. Mỗi file tương ứng với một passage/test và sẽ tạo ra các file CSV cùng tên trong thư mục output.

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

Chứa toàn bộ CSV đầu ra, được nhóm theo thư mục con tương ứng với thư mục của file input. Mỗi thư mục nhóm chứa cả Choice Question và Fill The Blank.

Tên file Choice Question dùng tiền tố `CHOICE-`, còn file Fill The Blank dùng tiền tố `FILL-` trước stem của input:

```text
input/cam20/CAM20-TEST1-PASSAGE1.txt
output/cam20/CHOICE-CAM20-TEST1-PASSAGE1.csv
output/cam20/FILL-CAM20-TEST1-PASSAGE1.csv
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
   - Image URL (để trống).
   - Example sentence (câu ví dụ tự nhiên, gần gũi, dùng được trong đời sống hàng ngày).
   - Vietnamese translation of the example sentence.
   - Synonym list (tìm các từ đồng nghĩa phù hợp, kèm nghĩa tiếng Việt).
   - Opposite list (tìm các từ trái nghĩa phù hợp, kèm nghĩa tiếng Việt).
4. Tạo Choice Question:
    - Mỗi từ tạo đúng 1 câu: English Definition.
5. Tạo Fill The Blank:
   - Mỗi từ tạo ít nhất 1 câu điền từ.
6. Đánh số liên tục:
   - Choice Question bắt đầu từ `1`.
   - Fill The Blank tiếp tục sau số cuối cùng của Choice Question.
7. Xuất CSV đúng số cột, đúng thứ tự cột, không thêm cột ngoài quy định.
8. Kiểm tra lại CSV trước khi hoàn tất.

### 2.1 Quy Tắc Chuẩn Hóa Nguyên Mẫu Trước Khi Tạo

Áp dụng các quy tắc này trong bước chuẩn hóa danh sách từ, trước khi thu thập metadata và tạo CSV:

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

1. Xác định file input tương ứng trong `/input` và thư mục nhóm tương ứng trong `/output`; trong đó có file `CHOICE-{INPUT_FILE_STEM}.csv` và file `FILL-{INPUT_FILE_STEM}.csv`.
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
9. Append bản ghi mới vào cuối các file CSV tương ứng, giữ nguyên các dòng đã có và không thay đổi số thứ tự cũ.
10. Kiểm tra lại rằng từ mới đã xuất hiện đầy đủ trong file input, Choice Question, và Fill The Blank tương ứng.

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

## 4. CSV Rules

### General CSV Requirements

- File CSV không bắt buộc có header. Nếu tạo mới theo bộ dữ liệu hiện tại, không thêm header để nhất quán với các file đang có.
- Mỗi record nằm trên một dòng CSV hợp lệ.
- Dùng dấu phẩy `,` làm delimiter.
- Nội dung chứa dấu phẩy hoặc dấu ngoặc kép nên được đặt trong dấu ngoặc kép `"..."`.
- Nếu trong field có dấu ngoặc kép, escape bằng cách nhân đôi `""`.
- Không để thừa hoặc thiếu cột.
- Không thêm Markdown trong CSV.
- Không dùng line break bên trong một field CSV.
- Encoding: UTF-8.

---

## 5. Choice Question Format

Mỗi record Choice Question phải có đúng 19 cột theo thứ tự:

```csv
number,question,a,b,c,d,answers,word,type,ipa-uk,ipa-us,cerf,definition,vietnamese,image,example,eg-vie,synonym,opposite
```

### 5.1 `number`

Định dạng:

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

- Bắt đầu từ `1` cho mỗi file input.
- Tăng dần theo thứ tự record.
- Unique trong cùng file CSV.
- `INPUT_FILE_STEM` là tên file input không bao gồm `.txt`.

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

Đường dẫn (URL) hình ảnh minh họa cho từ vựng.

Quy tắc:

- Để trống. Cột này vẫn tồn tại nhưng không điền giá trị.

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

```csv
number,question,answer,type,ipa-uk,ipa-us,cerf,definition,vietnamese,image,example,eg-vie,synonym,opposite
```

### 6.1 `number`

Định dạng giống Choice Question:

```text
{index}-{INPUT_FILE_STEM}
```

Quy tắc:

- Không bắt đầu lại từ `1`.
- Tiếp tục từ số cuối cùng của Choice Question trong cùng input.
- Ví dụ nếu Choice Question có 40 câu, Fill The Blank bắt đầu từ `41-{INPUT_FILE_STEM}`.

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

Đường dẫn (URL) hình ảnh minh họa cho từ vựng.

Quy tắc:

- Để trống. Cột này vẫn tồn tại nhưng không điền giá trị.

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

```csv
1-CAM20-TEST1-PASSAGE1,"Active at night rather than during the day.",solitary,plentiful,nocturnal,unattended,c,nocturnal,adjective,/nɒkˈtɜː.nəl/,/nɑːkˈtɝː.nəl/,B2,"Active at night rather than during the day.","Hoạt động về đêm.",,"Many animals like owls are nocturnal and hunt at night.","Nhiều loài động vật như cú là loài hoạt động về đêm và săn mồi vào ban đêm.",night-active (hoạt động về đêm),daytime (ban ngày)
```

### Fill The Blank Row

```csv
41-CAM20-TEST1-PASSAGE1,"Many animals that hunt after sunset are __.",nocturnal,adjective,/nɒkˈtɜː.nəl/,/nɑːkˈtɝː.nəl/,B2,"Active at night rather than during the day.","Hoạt động về đêm.",,,,
```

---

## 9. Quality Checklist

Trước khi kết thúc, Agent phải kiểm tra:

- Mỗi file Choice Question có tên `CHOICE-{INPUT_FILE_STEM}.csv` và mỗi file Fill The Blank có tên `FILL-{INPUT_FILE_STEM}.csv`.
- Choice Question có đúng 19 cột mỗi dòng.
- Fill The Blank có đúng 14 cột mỗi dòng.
- `answers` của Choice Question chỉ là `a`, `b`, `c`, hoặc `d`.
- `answer` của Fill The Blank là lowercase.
- Số thứ tự tăng dần và không trùng.
- Fill The Blank tiếp tục số thứ tự sau Choice Question.
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
- CSV được escape đúng với dấu ngoặc kép nếu có.
- Kiểm tra dấu chấm câu tương ứng theo yêu cầu.
- Không có dòng rỗng ngoài ý muốn ở cuối file nếu hệ thống import không yêu cầu.

---

## 10. Common Mistakes To Avoid

- Không ghi đáp án đúng dạng từ vựng vào cột `answers` của Choice Question.
- Không dùng nhiều hơn 4 lựa chọn.
- Không để definition quá rộng khiến nhiều lựa chọn đều đúng.
- Không dùng distractor khác loại từ nếu có lựa chọn tốt hơn.
- Không bỏ qua IPA UK/US.
- Không thêm header vào CSV mới nếu muốn nhất quán với các file hiện có.
- Không tạo bài trực tiếp từ danh từ số nhiều có quy tắc hoặc động từ quá khứ có quy tắc khi chúng cần được chuyển về nguyên mẫu trước.
- Không bỏ qua việc bổ sung từ gốc cho danh từ số nhiều bất quy tắc hoặc động từ bất quy tắc.
- Không chuyển tính từ dạng `-ed` hoặc `-ing` như `interested`, `interesting` về động từ gốc.
- Không đánh số lại toàn bộ file khi chỉ được yêu cầu bổ sung từ vựng vào danh sách đã tạo trước đó.
- Không quên thêm từ mới vào file input tương ứng khi bổ sung từ vựng.
- Không dùng kiểu đánh số `+` cho Fill The Blank khi bổ sung từ vựng.
- Không ghi sai tên cột `answer` thành `answers` trong Fill The Blank.
- Không bỏ sót cột `word`, `type`, `ipa-uk`, `ipa-us`, `cerf`, `definition`, `vietnamese`, `image`, `example`, `eg-vie`, `synonym`, `opposite` trong Choice Question.
- Không bỏ sót cột `type`, `ipa-uk`, `ipa-us`, `cerf`, `definition`, `vietnamese`, `image`, `example`, `eg-vie`, `synonym`, `opposite` trong Fill The Blank.
