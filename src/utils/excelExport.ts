import * as XLSX from 'xlsx';

/**
 * 通用Excel导出工具
 * @param data 要导出的数据数组
 * @param filename 文件名（不包含扩展名）
 * @param sheetName 工作表名称
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  if (!data || data.length === 0) {
    throw new Error('导出数据不能为空');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  const fullFileName = `${filename}.xlsx`;
  XLSX.writeFile(workbook, fullFileName);
  
  return fullFileName;
};

/**
 * 从Supabase查询结果导出Excel
 * @param queryResult Supabase查询结果
 * @param filename 文件名
 * @param sheetName 工作表名称
 */
export const exportQueryResultToExcel = (
  queryResult: any[], 
  filename: string, 
  sheetName: string = 'Sheet1'
) => {
  if (!queryResult || queryResult.length === 0) {
    throw new Error('查询结果为空，无法导出');
  }

  return exportToExcel(queryResult, filename, sheetName);
};