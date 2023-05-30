export const getId = idx => {
  const id = idx + 1
  return [
    ((id >> 0) & 0xff) / 0xff,
    ((id >> 8) & 0xff) / 0xff,
    ((id >> 16) & 0xff) / 0xff,
    ((id >> 24) & 0xff) / 0xff,
  ]
}
