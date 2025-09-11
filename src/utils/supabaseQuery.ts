import { supabase } from "@/integrations/supabase/client";

/**
 * 调用数据库函数获取班级各科平均分排名
 * @param assessmentIds 考试ID数组
 * @returns 班级各科平均分排名数据
 */
export const getClassSubjectAverages = async (assessmentIds: number[]) => {
  if (assessmentIds.length === 0) {
    throw new Error('考试ID数组不能为空');
  }

  try {
    // 调用edge function来执行数据库函数
    const { data, error } = await supabase.functions.invoke('get-class-averages', {
      body: { assessmentIds }
    });

    if (error) {
      throw error;
    }

    return data.data || [];
  } catch (error) {
    console.error('调用数据库函数失败:', error);
    throw error;
  }
};