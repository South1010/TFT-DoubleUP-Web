import { UnitDetail } from './compTypes';

export interface ArticleBoardData {
  id?: string;
  display_name?: string;
  main_carry?: {
    id: string;
    name: string;
    cost: number;
    icon?: string;
  };
  units?: UnitDetail[];
  traits_summary?: string;
  images?: { [key: string]: string };
}

export interface Article {
  id: number;
  title: string;
  category: string;
  cover_image?: string;
  summary?: string;
  content: string;
  board_data?: ArticleBoardData;
  boards?: { [key: string]: ArticleBoardData };
  images?: { [key: string]: string };
  created_at: number;
  updated_at?: number;
  is_published: number;
}
