
export default function (err, req, res, next) {
  res.status(err.status || 500).json({
    message: err.message || '서버에 에러가 발생했습니다.',
  });
}
