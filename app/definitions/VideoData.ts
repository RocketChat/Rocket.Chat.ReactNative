export interface VideoData {
    event_type: string;
    url: string;
    video_path: string;
    video_review: string;
    jump_url: string;
    surface_img: string;
    show_title: string;
    wx_url: string;
    poster_img: string;
    video_cover: string;
  }
  
  interface Row {
    id: string;
    user_id: string;
    label_name: string;
    array_list: string;
    tg_json: VideoData[];
  }
  
export interface ApiResponse {
    code: string;
    description: string;
    rows: Row[];
  }