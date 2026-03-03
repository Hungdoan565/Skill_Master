export const refundPolicy = {
  title: "Chính Sách Hoàn Phí",
  lastUpdated: "01/01/2025",
  sections: [
    {
      id: "rp-overview",
      heading: "Tổng Quan",
      content: "Skill Master cam kết mang đến trải nghiệm học tập tốt nhất cho học viên. Chúng tôi hiểu rằng trong một số trường hợp bất khả kháng, học viên có thể không thể tiếp tục khóa học. Chính sách hoàn phí này được thiết lập nhằm đảm bảo quyền lợi công bằng cho cả hai bên dựa trên thời điểm yêu cầu hoàn phí."
    },
    {
      id: "rp-tiers",
      heading: "Mức Hoàn Phí",
      content: "Tỷ lệ hoàn phí được tính dựa trên thời điểm học viên gửi yêu cầu chính thức so với ngày khai giảng của khóa học. Các khoản phí quản lý sẽ được khấu trừ theo quy định.",
      table: {
        headers: ["Thời điểm yêu cầu", "Mức hoàn phí", "Ghi chú"],
        rows: [
          ["Trước ngày khai giảng", "100%", "Trừ đi 5% phí quản lý và phí tài liệu (nếu đã nhận)"],
          ["Trong vòng 7 ngày đầu", "70%", "Áp dụng nếu số buổi học chưa vượt quá 2 buổi"],
          ["Sau 7 ngày", "Không hoàn phí", "Học viên có thể bảo lưu hoặc chuyển nhượng"]
        ]
      }
    },
    {
      id: "rp-process",
      heading: "Thời Gian & Quy Trình Xử Lý",
      content: "Yêu cầu hoàn phí phải được gửi bằng văn bản hoặc email qua kênh hỗ trợ chính thức của trung tâm.\n\nThời gian xử lý hoàn phí từ 7-14 ngày làm việc kể từ khi trung tâm xác nhận nhận đủ hồ sơ và được duyệt. Tiền hoàn sẽ được chuyển khoản trực tiếp vào tài khoản ngân hàng do học viên cung cấp."
    },
    {
      id: "rp-docs",
      heading: "Hồ Sơ Yêu Cầu",
      content: "Học viên cần cung cấp đầy đủ các giấy tờ sau để quá trình xử lý được diễn ra nhanh chóng:\n\n• Đơn xin hoàn phí theo mẫu của trung tâm.\n• Biên lai thu tiền gốc hoặc xác nhận chuyển khoản ngân hàng.\n• Chứng minh nhân dân/CCCD hoặc Giấy khai sinh (nếu là học viên dưới 18 tuổi).\n• Thẻ học viên và tài liệu học tập (trong trường hợp chưa sử dụng và còn nguyên vẹn)."
    }
  ]
};

export const preservationPolicy = {
  title: "Chính Sách Bảo Lưu",
  lastUpdated: "01/01/2025",
  sections: [
    {
      id: "pp-eligibility",
      heading: "Điều Kiện Bảo Lưu",
      content: "Học viên đang theo học tại Skill Master có quyền yêu cầu bảo lưu khóa học khi gặp các vấn đề bất khả kháng như sức khỏe, công tác đột xuất hoặc lý do cá nhân nghiêm trọng. Yêu cầu bảo lưu chỉ được xem xét nếu học viên đã hoàn thành đầy đủ nghĩa vụ học phí cho phần học hiện tại."
    },
    {
      id: "pp-window",
      heading: "Thời Gian Yêu Cầu",
      content: "Yêu cầu bảo lưu phải được thực hiện trong vòng 30 ngày kể từ ngày nghỉ học đầu tiên do lý do muốn bảo lưu. Trung tâm không giải quyết các trường hợp nộp đơn xin bảo lưu sau thời hạn này. Khóa học chỉ được tính là đang bảo lưu khi có xác nhận chính thức từ phòng Giáo vụ."
    },
    {
      id: "pp-duration",
      heading: "Thời Hạn Bảo Lưu Tối Đa",
      content: "Thời gian bảo lưu tối đa cho một khóa học là 3 tháng (90 ngày) kể từ ngày quyết định bảo lưu có hiệu lực.\n\nSau thời gian này, nếu học viên không quay lại tiếp tục khóa học hoặc không có yêu cầu gia hạn đặc biệt được phê duyệt, kết quả bảo lưu sẽ tự động bị hủy và học phí còn lại sẽ không được hoàn trả."
    },
    {
      id: "pp-steps",
      heading: "Quy Trình Thực Hiện",
      content: "Để thực hiện bảo lưu, học viên cần làm theo các bước sau:\n\n• Điền mẫu đơn xin bảo lưu tại quầy lễ tân hoặc qua email.\n• Nộp lại thẻ học viên tạm thời.\n• Nhận giấy xác nhận bảo lưu khóa học có mộc đỏ và chữ ký của đại diện trung tâm.\n• Lệ phí bảo lưu có thể được áp dụng tùy theo quy định của từng chương trình học."
    },
    {
      id: "pp-resume",
      heading: "Điều Kiện Nhập Học Lại",
      content: "Học viên phải thông báo cho trung tâm ít nhất 2 tuần trước khi muốn quay lại học để được sắp xếp lớp phù hợp. Trung tâm sẽ xếp lớp dựa trên trình độ tương đương và chỗ trống hiện tại. Nếu lớp học mong muốn đã đầy, học viên có thể cần chờ đến khóa tiếp theo."
    }
  ]
};

export const transferPolicy = {
  title: "Chính Sách Chuyển Nhượng",
  lastUpdated: "01/01/2025",
  sections: [
    {
      id: "tp-same-course",
      heading: "Chuyển Nhượng Cùng Khóa Học",
      content: "Học viên được phép chuyển nhượng khóa học hiện tại cho người khác 1 lần duy nhất mà không bị tính phí chuyển nhượng. Người nhận chuyển nhượng phải đáp ứng đủ điều kiện trình độ đầu vào của khóa học thông qua bài kiểm tra năng lực tại trung tâm."
    },
    {
      id: "tp-cross-course",
      heading: "Chuyển Nhượng Khác Khóa Học",
      content: "Trong trường hợp người nhận chuyển nhượng muốn học một khóa khác, phí chuyển nhượng sẽ được áp dụng. Nếu khóa học mới có học phí cao hơn, người nhận chuyển nhượng phải đóng thêm phần chênh lệch.\n\nNếu khóa học mới có học phí thấp hơn, phần học phí dư sẽ không được hoàn trả mà có thể được bảo lưu để sử dụng cho các khóa học tiếp theo."
    },
    {
      id: "tp-docs",
      heading: "Hồ Sơ Yêu Cầu",
      content: "Cả người chuyển và người nhận chuyển nhượng đều phải có mặt tại trung tâm để làm thủ tục. Hồ sơ bao gồm:\n\n• Đơn xin chuyển nhượng có chữ ký của cả hai bên.\n• CCCD/CMND của người chuyển và người nhận.\n• Biên lai thu tiền gốc của khóa học.\n• Đối với học viên dưới 18 tuổi, cần có sự đồng ý và chữ ký của phụ huynh/người giám hộ."
    },
    {
      id: "tp-exceptions",
      heading: "Các Trường Hợp Không Được Chuyển Nhượng",
      content: "Trung tâm không chấp nhận chuyển nhượng đối với các trường hợp sau: khóa học đã học quá 50% thời lượng, khóa học được mua trong các chương trình khuyến mãi đặc biệt (trừ khi có quy định khác), hoặc học viên đang trong thời gian bảo lưu quá hạn."
    }
  ]
};

export const paymentPolicy = {
  title: "Chính Sách Thanh Toán",
  lastUpdated: "01/01/2025",
  sections: [
    {
      id: "pay-methods",
      heading: "Phương Thức Thanh Toán",
      content: "Skill Master hỗ trợ nhiều phương thức thanh toán linh hoạt để tạo điều kiện thuận lợi nhất cho học viên:\n\n• Chuyển khoản ngân hàng trực tiếp vào tài khoản công ty.\n• Thanh toán tiền mặt tại quầy lễ tân của trung tâm.\n• Thanh toán trực tuyến qua thẻ tín dụng/ghi nợ (Visa, Mastercard) hoặc ví điện tử (MoMo, ZaloPay)."
    },
    {
      id: "pay-installment",
      heading: "Chính Sách Trả Góp",
      content: "Đối với các khóa học có thời lượng trên 3 tháng, trung tâm hỗ trợ hình thức thanh toán trả góp qua thẻ tín dụng với lãi suất 0%. Ngoài ra, học viên cũng có thể chia nhỏ khoản thanh toán thành 2-3 đợt theo thỏa thuận trực tiếp với trung tâm, đợt đầu tiên thanh toán tối thiểu 50% học phí."
    },
    {
      id: "pay-deadlines",
      heading: "Thời Hạn Thanh Toán",
      content: "Học viên cần hoàn tất thanh toán học phí ít nhất 3 ngày trước ngày khai giảng khóa học để được đảm bảo giữ chỗ. Trong trường hợp thanh toán chia đợt, các đợt tiếp theo phải được thanh toán đúng hạn như đã cam kết. Quá hạn thanh toán 7 ngày, trung tâm có quyền đình chỉ việc học cho đến khi hoàn tất nghĩa vụ tài chính."
    },
    {
      id: "pay-invoices",
      heading: "Hóa Đơn & Biên Lai",
      content: "Học viên sẽ nhận được biên lai thu tiền điện tử hoặc giấy xác nhận ngay sau khi hoàn tất thanh toán. Trung tâm cũng hỗ trợ xuất hóa đơn VAT theo yêu cầu của học viên hoặc doanh nghiệp. Yêu cầu xuất hóa đơn phải được thông báo trong vòng 7 ngày kể từ ngày thanh toán."
    }
  ]
};

export const commitmentPolicy = {
  title: "Cam Kết Chất Lượng",
  lastUpdated: "01/01/2025",
  sections: [
    {
      id: "cp-retake",
      heading: "Học Lại Miễn Phí",
      content: "Đối với các khóa học luyện thi IELTS và TOEIC, Skill Master cam kết chuẩn đầu ra. Nếu học viên không đạt điểm mục tiêu, sẽ được học lại hoàn toàn miễn phí 1 lần.\n\nĐiều kiện áp dụng: Học viên tham gia tối thiểu 80% số buổi học, hoàn thành 100% bài tập về nhà và tham gia đầy đủ các bài thi thử tại trung tâm."
    },
    {
      id: "cp-teachers",
      heading: "Chất Lượng Giáo Viên",
      content: "100% giáo viên tại Skill Master đều có chứng chỉ giảng dạy quốc tế (TESOL, CELTA) và kinh nghiệm giảng dạy tối thiểu 3 năm. Đối với các lớp luyện thi, giáo viên đứng lớp phải có điểm thi thực tế IELTS từ 8.0 trở lên hoặc TOEIC từ 950 trở lên."
    },
    {
      id: "cp-class-size",
      heading: "Sĩ Số Lớp Học",
      content: "Để đảm bảo chất lượng giảng dạy và sự tương tác tốt nhất giữa giáo viên và học viên, trung tâm cam kết duy trì sĩ số lớp học tối đa là 15 học viên/lớp. Lớp học giao tiếp và luyện nói có sĩ số tối đa là 12 học viên/lớp."
    },
    {
      id: "cp-materials",
      heading: "Tài Liệu Học Tập",
      content: "Học phí đã bao gồm toàn bộ giáo trình chính thức, tài liệu ôn tập độc quyền và quyền truy cập vào hệ thống học tập trực tuyến LMS của trung tâm. Tài liệu luôn được cập nhật liên tục theo cấu trúc đề thi mới nhất."
    }
  ]
};

export const termsOfService = {
  title: "Điều Khoản Sử Dụng",
  lastUpdated: "01/01/2025",
  sections: [
    {
      id: "tos-scope",
      heading: "Phạm Vi Dịch Vụ",
      content: "Điều khoản này áp dụng cho toàn bộ các dịch vụ giảng dạy, nền tảng học tập trực tuyến và các tiện ích hỗ trợ khác do Skill Master cung cấp. Việc học viên đăng ký khóa học đồng nghĩa với việc đã đọc, hiểu và chấp thuận toàn bộ các điều khoản này."
    },
    {
      id: "tos-obligations",
      heading: "Nghĩa Vụ Của Học Viên",
      content: "Học viên có trách nhiệm tham gia đầy đủ các buổi học và hoàn thành bài tập được giao. Nghiêm cấm các hành vi gian lận trong thi cử, kiểm tra. Học viên phải tôn trọng giáo viên, nhân viên trung tâm và các học viên khác. Mọi hành vi quấy rối, xúc phạm hoặc gây rối trật tự đều có thể dẫn đến việc bị đình chỉ học không hoàn phí."
    },
    {
      id: "tos-ip",
      heading: "Sở Hữu Trí Tuệ",
      content: "Toàn bộ giáo trình, tài liệu phát tay, video bài giảng và tài nguyên trên hệ thống LMS đều thuộc sở hữu trí tuệ của Skill Master. Học viên chỉ được sử dụng cho mục đích học tập cá nhân. Nghiêm cấm mọi hành vi sao chép, phát tán, chia sẻ cho bên thứ ba hoặc sử dụng cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản."
    },
    {
      id: "tos-liability",
      heading: "Giới Hạn Trách Nhiệm",
      content: "Skill Master không chịu trách nhiệm cho các tổn thất gián tiếp, ngẫu nhiên hoặc do hậu quả phát sinh từ việc học viên không thể sử dụng dịch vụ vì các lý do bất khả kháng (thiên tai, dịch bệnh, lỗi hệ thống mạng quốc gia). Trách nhiệm đền bù tối đa của trung tâm trong mọi trường hợp không vượt quá tổng số tiền học phí mà học viên đã thanh toán."
    },
    {
      id: "tos-modification",
      heading: "Sửa Đổi Điều Khoản",
      content: "Trung tâm bảo lưu quyền sửa đổi, bổ sung hoặc cập nhật các Điều khoản sử dụng này vào bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được công bố chính thức trên website và hệ thống thông báo nội bộ. Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc học viên chấp nhận các điều khoản mới."
    }
  ]
};

export const privacyPolicy = {
  title: "Chính Sách Bảo Mật",
  lastUpdated: "01/01/2025",
  sections: [
    {
      id: "priv-data",
      heading: "Dữ Liệu Thu Thập & Mục Đích",
      content: "Chúng tôi thu thập các thông tin cá nhân bao gồm: họ tên, số điện thoại, địa chỉ email, trình độ học vấn hiện tại và lịch sử học tập. Mục đích thu thập nhằm: quản lý hồ sơ học viên, sắp xếp lớp học phù hợp, liên lạc để thông báo lịch học/điểm thi, và cá nhân hóa trải nghiệm học tập trên hệ thống."
    },
    {
      id: "priv-storage",
      heading: "Lưu Trữ & Bảo Vệ Dữ Liệu",
      content: "Dữ liệu cá nhân của người dùng được lưu trữ trên các máy chủ đám mây an toàn với tiêu chuẩn mã hóa SSL/TLS. Truy cập vào cơ sở dữ liệu được giới hạn chặt chẽ theo phân quyền (RBAC), chỉ những nhân viên có thẩm quyền mới được phép tiếp cận thông tin để thực hiện nghiệp vụ."
    },
    {
      id: "priv-sharing",
      heading: "Chia Sẻ Thông Tin",
      content: "Skill Master cam kết tuyệt đối không bán, trao đổi hoặc chia sẻ thông tin cá nhân của học viên cho bất kỳ bên thứ ba nào vì mục đích thương mại. Thông tin chỉ được chia sẻ trong trường hợp có sự đồng ý rõ ràng từ học viên, hoặc khi có yêu cầu bắt buộc từ các cơ quan bảo vệ pháp luật có thẩm quyền."
    },
    {
      id: "priv-rights",
      heading: "Quyền Lợi Người Dùng",
      content: "Tuân thủ theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, học viên có đầy đủ các quyền: yêu cầu cung cấp bản sao dữ liệu, quyền chỉnh sửa thông tin sai sót, quyền rút lại sự đồng ý và quyền yêu cầu xóa bỏ hoàn toàn dữ liệu cá nhân khỏi hệ thống của trung tâm."
    },
    {
      id: "priv-retention",
      heading: "Thời Gian Lưu Trữ",
      content: "Dữ liệu hồ sơ học viên sẽ được lưu trữ an toàn trong suốt thời gian học tập và duy trì thêm tối đa 2 năm kể từ hoạt động cuối cùng tại trung tâm nhằm phục vụ cho việc cấp lại chứng chỉ hoặc xác nhận kết quả học tập khi cần thiết. Sau thời gian này, dữ liệu sẽ được xóa hoặc ẩn danh hóa hoàn toàn."
    },
    {
      id: "priv-contact",
      heading: "Liên Hệ Hỗ Trợ Bảo Mật",
      content: "Mọi thắc mắc, khiếu nại hoặc yêu cầu liên quan đến quyền riêng tư và xử lý dữ liệu cá nhân, vui lòng liên hệ trực tiếp với Bộ phận Chăm sóc Khách hàng của chúng tôi qua email privacy@skillmaster.edu.vn hoặc hotline để được giải quyết nhanh chóng."
    }
  ]
};

export const faqItems = [
  // Học phí
  {
    id: "faq-1",
    category: "hoc-phi",
    question: "Học phí đã bao gồm tài liệu và lệ phí thi chưa?",
    answer: "Học phí tại Skill Master đã bao gồm toàn bộ giáo trình, tài liệu phát tay trên lớp và quyền truy cập LMS. Tuy nhiên, lệ phí thi chứng chỉ quốc tế (như thi thật IELTS tại BC/IDP) không bao gồm trong học phí."
  },
  {
    id: "faq-2",
    category: "hoc-phi",
    question: "Trung tâm có chính sách cam kết đầu ra như thế nào?",
    answer: "Chúng tôi cam kết đầu ra bằng văn bản cho các khóa IELTS và TOEIC. Nếu bạn không đạt điểm mục tiêu sau kỳ thi, bạn sẽ được học lại miễn phí 1 lần, với điều kiện tham gia đủ 80% số buổi và làm 100% bài tập."
  },
  {
    id: "faq-3",
    category: "hoc-phi",
    question: "Quy trình xin hoàn phí diễn ra như thế nào?",
    answer: "Bạn cần nộp Đơn xin hoàn phí tại quầy lễ tân. Trong vòng 7-14 ngày làm việc, trung tâm sẽ xử lý và chuyển khoản lại phần phí được hoàn (tùy thuộc vào thời điểm bạn rút theo chính sách Hoàn phí) vào tài khoản của bạn."
  },
  {
    id: "faq-4",
    category: "hoc-phi",
    question: "Tôi có thể thanh toán học phí trả góp không?",
    answer: "Có, trung tâm hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng cho các khóa học trên 3 tháng. Ngoài ra, bạn cũng có thể chia kỳ thanh toán (2-3 đợt) trực tiếp với trung tâm."
  },
  {
    id: "faq-5",
    category: "hoc-phi",
    question: "Có mất phí khi yêu cầu bảo lưu khóa học không?",
    answer: "Bảo lưu lần đầu tiên hoàn toàn miễn phí nếu bạn thực hiện đúng quy trình trong vòng 30 ngày. Các lần bảo lưu tiếp theo (nếu được duyệt ngoại lệ) có thể sẽ phát sinh phí hành chính."
  },

  // Lớp học
  {
    id: "faq-6",
    category: "lop-hoc",
    question: "Sĩ số tối đa của một lớp học là bao nhiêu?",
    answer: "Để đảm bảo chất lượng giảng dạy, sĩ số lớp học của chúng tôi được giới hạn ở mức tối đa 15 học viên/lớp đối với các lớp tổng quát, và 12 học viên/lớp đối với các lớp chuyên giao tiếp."
  },
  {
    id: "faq-7",
    category: "lop-hoc",
    question: "Giáo viên giảng dạy là người Việt Nam hay bản xứ?",
    answer: "Trung tâm áp dụng mô hình giảng dạy kết hợp. Các kỹ năng Reading/Listening sẽ do giáo viên Việt Nam có kinh nghiệm chuyên sâu đảm nhận. Các kỹ năng Speaking/Writing sẽ có sự tham gia của giáo viên bản xứ."
  },
  {
    id: "faq-8",
    category: "lop-hoc",
    question: "Tôi có thể học thử trước khi đăng ký chính thức không?",
    answer: "Có, chúng tôi cung cấp 1 buổi học thử miễn phí cho học viên mới. Bạn có thể trải nghiệm không gian học, phương pháp giảng dạy và đánh giá mức độ phù hợp trước khi quyết định đăng ký."
  },
  {
    id: "faq-9",
    category: "lop-hoc",
    question: "Quy trình làm bài kiểm tra xếp lớp (Placement Test) ra sao?",
    answer: "Bạn có thể làm bài test đầu vào hoàn toàn miễn phí. Bài test kéo dài khoảng 45 phút bao gồm các kỹ năng Nghe - Đọc - Viết và 10 phút phỏng vấn Nói trực tiếp với giáo viên."
  },
  {
    id: "faq-10",
    category: "lop-hoc",
    question: "Tôi có được học bù nếu nghỉ ốm không?",
    answer: "Có. Bạn cần thông báo trước ít nhất 12 giờ. Trung tâm sẽ sắp xếp cho bạn học bù ở một lớp khác có cùng tiến độ, hoặc cung cấp video bài giảng đã được ghi lại của buổi học đó."
  },

  // Chứng chỉ
  {
    id: "faq-11",
    category: "chung-chi",
    question: "Trung tâm đang đào tạo những loại chứng chỉ nào?",
    answer: "Chúng tôi tập trung đào tạo chuyên sâu các chứng chỉ tiếng Anh quốc tế bao gồm: IELTS (Academic & General), TOEIC (4 kỹ năng), TOEFL iBT và các chứng chỉ Cambridge (PET, FCE)."
  },
  {
    id: "faq-12",
    category: "chung-chi",
    question: "Thời hạn sử dụng của chứng chỉ IELTS/TOEIC là bao lâu?",
    answer: "Hầu hết các chứng chỉ tiếng Anh quốc tế phổ biến như IELTS, TOEIC và TOEFL đều có giá trị sử dụng trong vòng 2 năm kể từ ngày thi ghi trên bảng điểm."
  },
  {
    id: "faq-13",
    category: "chung-chi",
    question: "Trung tâm có hỗ trợ đăng ký thi chứng chỉ thực tế không?",
    answer: "Có. Là đối tác chính thức của IDP và British Council, chúng tôi hỗ trợ học viên hoàn tất toàn bộ thủ tục đăng ký thi lấy chứng chỉ quốc tế nhanh chóng và tiện lợi."
  },

  // Hỗ trợ
  {
    id: "faq-14",
    category: "ho-tro",
    question: "Trung tâm có hỗ trợ gì sau khi kết thúc khóa học không?",
    answer: "Học viên cũ được tham gia câu lạc bộ Tiếng Anh miễn phí vào cuối tuần, được quyền truy cập hệ thống thư viện đề thi và tài liệu trực tuyến thêm 6 tháng sau khi khóa học kết thúc."
  },
  {
    id: "faq-15",
    category: "ho-tro",
    question: "Tôi có thể nhờ giảng viên giải đáp thắc mắc trực tuyến không?",
    answer: "Hoàn toàn được. Hệ thống LMS của trung tâm có tính năng chat và thảo luận trực tuyến, nơi bạn có thể đặt câu hỏi và nhận giải đáp từ đội ngũ trợ giảng và giáo viên trong vòng 24 giờ."
  },
  {
    id: "faq-16",
    category: "ho-tro",
    question: "Quy trình chuyển nhượng khóa học diễn ra như thế nào?",
    answer: "Bạn và người nhận chuyển nhượng cần đem theo CCCD và biên lai học phí đến trung tâm để điền đơn xin chuyển nhượng. Quá trình xét duyệt và hoàn tất thủ tục thường mất khoảng 2-3 ngày làm việc."
  }
];

export const faqCategories = [
  { value: "all", label: "Tất cả" },
  { value: "hoc-phi", label: "Học phí" },
  { value: "lop-hoc", label: "Lớp học" },
  { value: "chung-chi", label: "Chứng chỉ" },
  { value: "ho-tro", label: "Hỗ trợ" }
];