export const normalizeAvatarUrl = (avatarUrl) => {
  if (typeof avatarUrl !== 'string') return null;

  const trimmedUrl = avatarUrl.trim();
  if (!trimmedUrl) return null;

  if (
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://') ||
    trimmedUrl.startsWith('//') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('blob:') ||
    trimmedUrl.startsWith('/')
  ) {
    return trimmedUrl;
  }

  return `/${trimmedUrl.replace(/^(\.\.\/|\.\/)+/, '')}`;
};

export default normalizeAvatarUrl;
