import { IBnccSkill } from '@/_base/interfaces/shared/IBnccSkill';
import axios from 'axios';

export const getBnccSkills = async (): Promise<IBnccSkill[]> => {
  const { data } = await axios.get(`${import.meta.env.VITE_API_ADDRESS}/bncc`);
  return data;
};
