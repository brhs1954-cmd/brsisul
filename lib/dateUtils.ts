
export const getKSTDate = (input?: any): Date => {
  const date = input ? new Date(input) : new Date();
  if (isNaN(date.getTime())) return new Date();
  
  // Get UTC time
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  
  // KST is UTC+9
  const kstOffset = 9 * 60 * 60 * 1000;
  return new Date(utc + kstOffset);
};

export const formatDateToKST = (input: any): string => {
  if (!input) return "";
  const kstDate = getKSTDate(input);
  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTimestampToKST = (input: any): string => {
  if (!input) return "";
  const kstDate = getKSTDate(input);
  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  const hours = String(kstDate.getHours()).padStart(2, '0');
  const minutes = String(kstDate.getMinutes()).padStart(2, '0');
  const seconds = String(kstDate.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const getCurrentKSTDateString = (): string => {
  return formatDateToKST(new Date());
};
