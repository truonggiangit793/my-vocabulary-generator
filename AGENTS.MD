# IELTS Vocabulary CSV Generator Agent

Tài liệu này là đặc tả bắt buộc cho Agent khi chuyển đổi danh sách từ vựng trong `/input` thành hai loại bài tập CSV:

- Choice Question: câu hỏi trắc nghiệm, lưu trong `/choice-question`.
- Fill The Blank: câu hỏi điền từ, lưu trong `/fill-the-blank`.

Agent phải ưu tiên độ chính xác ngữ nghĩa, tính nhất quán định dạng CSV, và khả năng import dữ liệu ổn định vào hệ thống học từ vựng.

---

## 1. Directory Structure

```text
.
├── AGENTS.MD
├── input/
├── choice-question/
└── fill-the-blank/
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

### `choice-question/`

Chứa CSV đầu ra cho câu hỏi trắc nghiệm.

Tên file output phải trùng stem với input:

```text
input/CAM20-TEST1-PASSAGE1.txt
choice-question/CAM20-TEST1-PASSAGE1.csv
```

### `fill-the-blank/`

Chứa CSV đầu ra cho câu hỏi điền từ.

Tên file output phải trùng stem với input:

```text
input/CAM20-TEST1-PASSAGE1.txt
fill-the-blank/CAM20-TEST1-PASSAGE1.csv
```

---

## 2. General Generation Workflow

Với mỗi file trong `/input`, Agent thực hiện theo thứ tự:

1. Đọc toàn bộ từ vựng trong file input.
2. Chuẩn hóa danh sách từ:
   - Loại dòng trống.
   - Tách `word`, `meaning/synonyms`, và optional note sau `#`.
   - Xác định loại từ chính: noun, verb, adjective, adverb, phrase, phrasal verb, idiom.
3. Thu thập metadata cho từng từ:
   - Word display.
   - Part of speech.
   - IPA UK và IPA US.
   - CEFR.
   - English definition.
   - Vietnamese meaning.
4. Tạo Choice Question:
   - Mỗi từ tạo đúng 2 câu: Type 1 và Type 2.
5. Tạo Fill The Blank:
   - Mỗi từ tạo ít nhất 1 câu điền từ.
6. Đánh số liên tục:
   - Choice Question bắt đầu từ `1`.
   - Fill The Blank tiếp tục sau số cuối cùng của Choice Question.
7. Xuất CSV đúng số cột, đúng thứ tự cột, không thêm cột ngoài quy định.
8. Kiểm tra lại CSV trước khi hoàn tất.

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
- Phù hợp đúng nghĩa của từ trong input.
- Không dùng chính từ đích trong definition nếu có thể tránh.
- Chỉ diễn đạt một nghĩa chính để tránh nhiều đáp án đúng.

### Vietnamese Meaning

Yêu cầu:

- Ngắn gọn, tự nhiên, đúng ngữ cảnh IELTS.
- Có thể là cụm danh từ, cụm động từ, hoặc câu giải thích ngắn.
- Không quá dài nếu dùng trong câu hỏi Type 2.
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

Mỗi record Choice Question phải có đúng 14 cột theo thứ tự:

```csv
number,question,a,b,c,d,answers,word,type,ipa-uk,ipa-us,cerf,definition,vietnamese
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

Agent phải tạo đủ 2 loại câu hỏi cho mỗi từ.

#### Type 1: Definition => Vocabulary

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
- Ngắn gọn, chính xác.
- Chỉ có một đáp án đúng trong 4 lựa chọn.

#### Type 2: Vietnamese Meaning => Vocabulary

Format:

```text
Nghĩa tiếng Việt.
```

Ví dụ:

```text
Hoạt động về đêm.
```

Yêu cầu:

- Nghĩa tiếng Việt ngắn gọn.
- Chỉ có một đáp án đúng trong 4 lựa chọn.
- Không viết kèm từ tiếng Anh trong phần nghĩa tiếng Việt, trừ tên riêng hoặc thuật ngữ bắt buộc.

### 5.3 Columns `a` to `d`

Quy tắc:

- Sử dụng `a`, `b`, `c`, `d` cho 4 lựa chọn.
- Có đúng một đáp án đúng.
- Đáp án đúng phải là chính xác từ/cụm từ đích trong input.
- Các distractor phải là đáp án gây nhiễu hợp lý, không phải các từ khác biệt quá nổi bật khiến người học dễ loại bằng cảm tính.
- Distractor nên cùng loại từ với đáp án đúng nếu có thể.
- Distractor nên có độ dài, hình thức, mức độ học thuật, và độ khó tương đối gần với đáp án đúng.
- Ưu tiên distractor cùng chủ đề, cùng ngữ cảnh IELTS, hoặc gần trường nghĩa nhưng không đồng nghĩa hoàn toàn.
- Với Type 1, distractor cần đủ gần nghĩa để buộc người học hiểu definition, nhưng vẫn sai rõ khi xét chính xác định nghĩa.
- Với Type 2, distractor cần đủ gần nghĩa tiếng Việt hoặc cùng nhóm chủ đề, nhưng không được là bản dịch đúng của câu hỏi.
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

Từ hoặc cụm từ đích, viết hoa chữ cái đầu.

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

- Không chứa dấu ngoặc kép hoặc xuống dòng.

### 5.11 `vietnamese`

Giá trị là nghĩa tiếng Việt ngắn gọn, tự nhiên, đúng ngữ cảnh IELTS.

Quy tắc:

- Không chứa dấu ngoặc kép hoặc xuống dòng.

---

## 6. Fill The Blank Format

Mỗi record Fill The Blank phải có đúng 9 cột theo thứ tự:

```csv
number,question,answer,type,ipa-uk,ipa-us,cerf,definition,vietnamese
```

### 6.1 `number`

Định dạng giống Choice Question:

```text
{index}-{INPUT_FILE_STEM}
```

Quy tắc:

- Không bắt đầu lại từ `1`.
- Tiếp tục từ số cuối cùng của Choice Question trong cùng input.
- Ví dụ nếu Choice Question có 80 câu, Fill The Blank bắt đầu từ `81-{INPUT_FILE_STEM}`.

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
- Mỗi `__` chỉ đại diện cho **1 từ**.
- Với cụm từ có nhiều từ, dùng số lượng `__` tương ứng với số từ trong cụm. Ví dụ `home range` → `__ __`, `account for` → `__ __`.
- Câu phải có đủ ngữ cảnh để suy ra một đáp án hợp lý.
- Không để lộ từ đích hoặc biến thể quá rõ của từ đích trong câu hỏi.
- Không tạo câu quá chung khiến nhiều đáp án khác nhau đều đúng.

### 6.3 `answer`

Quy tắc:

- Ghi đáp án đúng ở dạng lowercase.
- Giữ dấu gạch nối, khoảng trắng, và ký tự đặc biệt nếu thuộc từ gốc.
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

- Không chứa dấu ngoặc kép hoặc xuống dòng.

### 6.9 `vietnamese`

Giá trị là nghĩa tiếng Việt ngắn gọn, tự nhiên, đúng ngữ cảnh IELTS.

Quy tắc:

- Không chứa dấu ngoặc kép hoặc xuống dòng.

---

## 7. Question Count Rules

Với mỗi từ hợp lệ trong input:

- Tạo 2 Choice Questions:
  - 1 câu Type 1: Definition => Vocabulary.
  - 1 câu Type 2: Vietnamese Meaning => Vocabulary.
- Tạo ít nhất 1 Fill The Blank question.

Ví dụ input có 40 từ hợp lệ:

- Choice Question: 80 records.
- Fill The Blank: ít nhất 40 records, bắt đầu từ `81-{INPUT_FILE_STEM}`.

---

## 8. Output Example

### Choice Question Row

```csv
1-CAM20-TEST1-PASSAGE1,"Active at night rather than during the day.",solitary,plentiful,nocturnal,unattended,c,Nocturnal,adjective,/nɒkˈtɜː.nəl/,/nɑːkˈtɝː.nəl/,B2,"Active at night rather than during the day.","Hoạt động về đêm."
```

### Fill The Blank Row

```csv
81-CAM20-TEST1-PASSAGE1,"Many animals that hunt after sunset are __.",nocturnal,adjective,/nɒkˈtɜː.nəl/,/nɑːkˈtɝː.nəl/,B2,"Active at night rather than during the day.","Hoạt động về đêm."
```

---

## 9. Quality Checklist

Trước khi kết thúc, Agent phải kiểm tra:

- Mỗi file output có đúng tên tương ứng với input.
- Choice Question có đúng 14 cột mỗi dòng.
- Fill The Blank có đúng 9 cột mỗi dòng.
- `answers` của Choice Question chỉ là `a`, `b`, `c`, hoặc `d`.
- `answer` của Fill The Blank là lowercase.
- Số thứ tự tăng dần và không trùng.
- Fill The Blank tiếp tục số thứ tự sau Choice Question.
- Mỗi từ có đủ Type 1 và Type 2 trong Choice Question.
- Mỗi câu hỏi chỉ có một đáp án đúng.
- Distractor không trùng đáp án đúng và không gây nhập nhằng.
- CSV được escape đúng với dấu ngoặc kép nếu có.
- Không có dòng rỗng ngoài ý muốn ở cuối file nếu hệ thống import không yêu cầu.

---

## 10. Common Mistakes To Avoid

- Không ghi đáp án đúng dạng từ vựng vào cột `answers` của Choice Question.
- Không dùng nhiều hơn 4 lựa chọn.
- Không để definition quá rộng khiến nhiều lựa chọn đều đúng.
- Không dùng distractor khác loại từ nếu có lựa chọn tốt hơn.
- Không bỏ qua IPA UK/US.
- Không thêm header vào CSV mới nếu muốn nhất quán với các file hiện có.
- Không ghi sai tên cột `answer` thành `answers` trong Fill The Blank.
- Không bỏ sót cột `word`, `type`, `ipa-uk`, `ipa-us`, `cerf`, `definition`, `vietnamese` trong Choice Question.
- Không bỏ sót cột `type`, `ipa-uk`, `ipa-us`, `cerf`, `definition`, `vietnamese` trong Fill The Blank.
