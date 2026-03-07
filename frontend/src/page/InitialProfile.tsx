export default function InitialProfile() {
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    // データベースに入力内容を送信するコード
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="profile-image">プロフィール画像</label>
      <input type="file" id="profile-image" />
      <label htmlFor="username">ユーザ名</label>
      <input type="text" id="username" />
      <button type="submit">プロフィールを確定</button>
    </form>
  );
}
