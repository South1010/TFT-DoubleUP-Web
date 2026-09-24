'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Plus, Save, Trash2, Grid, Check, Sparkles, AlertCircle, HeartHandshake, Shield, Award, ArrowLeft, X, Search, Zap, Star, BookOpen, FileText, Image as ImageIcon, Video, Eye, EyeOff, Upload, User, Cloud } from 'lucide-react';
import Link from 'next/link';
import { CompStat, UnitDetail, Item, getTierStyle } from '@/utils/compTypes';
import { Article, ArticleBoardData } from '@/utils/articleTypes';
import { FALLBACK_ARTICLES } from '@/utils/fallbackArticles';
import { FALLBACK_COMPS } from '@/utils/fallbackComps';
import { calculateAllTeamTraits } from '@/utils/traitHelpers';
import { getAllChampions, getAllItems, getAllAugments, getAugment, getChampion, getChampionIcon, getChampionName, getItemIcon, getItemName, getAugmentTierStyle, CHAMP_COST_MAP } from '@/utils/setMaster';
import ItemIcon from '@/components/ItemIcon';
import TftHexBoard from '@/components/TftHexBoard';
import ArticleRichContent from '@/components/ArticleRichContent';

interface ChampionMaster {
  id: string;
  name: string;
  cost: number;
  icon: string;
  traits?: string[];
}

interface AugmentMaster {
  id: string;
  name: string;
  icon: string;
  tier?: string;
  desc?: string;
}

const hexClipPath = '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]';

const resolveUnitCost = (unit?: UnitDetail | null): number => {
  if (!unit) return 1;
  const idOrName = unit.id || unit.name || '';
  const cleanIdOrName = idOrName
    .replace(/^(TFT18_|DA_18_|DA_|TFT_)/i, '')
    .replace(/(_AD|_AP|Small|Base)$/i, '')
    .replace(/\d+$/g, '')
    .trim();

  const displayName = getChampionName(idOrName);

  const mapCost =
    CHAMP_COST_MAP[unit.name || ''] ||
    CHAMP_COST_MAP[unit.id || ''] ||
    CHAMP_COST_MAP[cleanIdOrName] ||
    CHAMP_COST_MAP[cleanIdOrName.toLowerCase()] ||
    CHAMP_COST_MAP[displayName] ||
    CHAMP_COST_MAP[displayName.toLowerCase()];

  if (mapCost && !isNaN(Number(mapCost))) {
    return Number(mapCost);
  }

  const champMaster = getChampion(idOrName);
  const parsedMasterCost = Number(champMaster?.cost);
  if (!isNaN(parsedMasterCost) && parsedMasterCost >= 1 && parsedMasterCost <= 5) {
    return parsedMasterCost;
  }

  const parsedUnitCost = Number(unit.cost);
  if (!isNaN(parsedUnitCost) && parsedUnitCost >= 1 && parsedUnitCost <= 5) {
    return parsedUnitCost;
  }

  return 1;
};

const getCostBorderStyle = (cost: number | string): React.CSSProperties => {
  const c = Number(cost);
  switch (c) {
    case 5:
      return {
        background: 'linear-gradient(135deg, #fde047 0%, #f59e0b 50%, #d97706 100%)',
        boxShadow: '0 0 14px rgba(245, 158, 11, 0.95)',
      };
    case 4:
      return {
        background: 'linear-gradient(135deg, #e879f9 0%, #a855f7 50%, #6366f1 100%)',
        boxShadow: '0 0 14px rgba(168, 85, 247, 0.95)',
      };
    case 3:
      return {
        background: 'linear-gradient(135deg, #67e8f9 0%, #0284c7 50%, #2563eb 100%)',
        boxShadow: '0 0 14px rgba(6, 182, 212, 0.95)',
      };
    case 2:
      return {
        background: 'linear-gradient(135deg, #6ee7b7 0%, #10b981 50%, #15803d 100%)',
        boxShadow: '0 0 14px rgba(16, 185, 129, 0.95)',
      };
    case 1:
    default:
      return {
        background: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 50%, #334155 100%)',
        boxShadow: '0 0 8px rgba(148, 163, 184, 0.6)',
      };
  }
};

const getStarStyle = (cost: number | string): React.CSSProperties => {
  const c = Number(cost);
  let color = '#e2e8f0';
  if (c === 5) color = '#fde047';
  else if (c === 4) color = '#e879f9';
  else if (c === 3) color = '#38bdf8';
  else if (c === 2) color = '#34d399';

  return {
    color: color,
    WebkitTextFillColor: color,
    WebkitTextStroke: '1px #000000',
    filter: 'drop-shadow(0px 1.5px 2px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 2px rgba(0,0,0,0.9))',
  };
};

const renderStars = (starCount: number, cost: number) => {
  if (!starCount || starCount <= 1) return null;
  const style = getStarStyle(cost);
  const count = Math.min(starCount, 3);
  return (
    <div className="absolute top-1.5 inset-x-0 z-20 flex items-center justify-center gap-0.5 pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={style} className="text-[14px] font-black leading-none">★</span>
      ))}
    </div>
  );
};

const ArticleContentPreview = ({
  content,
  images,
  boardUnits,
  boardDisplayName,
  boards
}: {
  content: string;
  images: { [key: string]: string };
  boardUnits?: UnitDetail[];
  boardDisplayName?: string;
  boards?: { [key: string]: ArticleBoardData };
}) => {
  if (!content && (!boardUnits || boardUnits.length === 0) && (!boards || Object.keys(boards).length === 0)) {
    return (
      <div className="py-16 text-center text-slate-400 text-xs font-bold">
        本文がまだ入力されていません。「本文を編集」タブで文章や画像を入力してください。
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs">
      <ArticleRichContent
        content={content}
        images={images}
        boardUnits={boardUnits}
        boardDisplayName={boardDisplayName}
        boards={boards}
      />
    </div>
  );
};

export default function AdminPage() {
  const [passcode, setPasscode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Admin Tab: 'COMPS' | 'ARTICLES'
  const [adminTab, setAdminTab] = useState<'COMPS' | 'ARTICLES'>('COMPS');

  // Comp Data Form State
  const [compsList, setCompsList] = useState<CompStat[]>([]);
  const [champions, setChampions] = useState<ChampionMaster[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [augments, setAugments] = useState<AugmentMaster[]>([]);
  const [selectedCompKey, setSelectedCompKey] = useState<string>('NEW');

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [tier, setTier] = useState('S');
  const [mainCarryId, setMainCarryId] = useState('');
  const [traitsSummary, setTraitsSummary] = useState('');
  const [rerollLevel, setRerollLevel] = useState('Standard');
  const [overview, setOverview] = useState('');
  const [playConditions, setPlayConditions] = useState('');
  const [progressionGuide, setProgressionGuide] = useState('');
  const [dedicatedAugment, setDedicatedAugment] = useState('');
  const [selectedAugments, setSelectedAugments] = useState<AugmentMaster[]>([]);
  const [augmentSearchQuery, setAugmentSearchQuery] = useState('');
  const [partnerKeys, setPartnerKeys] = useState<string[]>([]);

  // Board Placement Editor State per Level Tab
  const [currentLvlTab, setCurrentLvlTab] = useState<string>('FINAL');
  const [boardUnitsMap, setBoardUnitsMap] = useState<{ [lvl: string]: UnitDetail[] }>({
    FINAL: []
  });

  // Cell Editor Modal / Selector State
  const [editingCellTarget, setEditingCellTarget] = useState<'COMP' | 'ARTICLE'>('COMP');
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedChampForCell, setSelectedChampForCell] = useState<string>('');
  const [selectedStarForCell, setSelectedStarForCell] = useState<number>(2);
  const [selectedItemsForCell, setSelectedItemsForCell] = useState<string[]>([]);
  const [cellSearchQuery, setCellSearchQuery] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [costFilter, setCostFilter] = useState<number | 'ALL'>('ALL');

  // Article Admin State
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<number | 'NEW'>('NEW');
  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState('構成ガイド');
  const [artCoverImage, setArtCoverImage] = useState('');
  const [artSummary, setArtSummary] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artAttachBoard, setArtAttachBoard] = useState(false);
  const [artBoards, setArtBoards] = useState<{ [key: string]: ArticleBoardData }>({
    '1': { id: '1', display_name: '構成盤面 1', units: [] }
  });
  const [activeBoardKey, setActiveBoardKey] = useState<string>('1');
  const [artBoardDisplayName, setArtBoardDisplayName] = useState('');
  const [artMainCarryId, setArtMainCarryId] = useState('');
  const [artBoardUnits, setArtBoardUnits] = useState<UnitDetail[]>([]);
  const [artIsPublished, setArtIsPublished] = useState(1);
  const [artImages, setArtImages] = useState<{ [key: string]: string }>({});
  const [artEditorTab, setArtEditorTab] = useState<'EDIT' | 'PREVIEW'>('EDIT');

  // Switch active board tab
  const handleSwitchActiveBoard = (key: string, currentBoards = artBoards) => {
    setActiveBoardKey(key);
    const b = currentBoards[key] || { id: key, display_name: `構成盤面 ${key}`, units: [] };
    setArtBoardUnits(b.units || []);
    setArtBoardDisplayName(b.display_name || '');
    setArtMainCarryId(b.main_carry?.id || '');
  };

  // Add new board
  const handleAddNewBoard = () => {
    const existingNumKeys = Object.keys(artBoards).map(Number).filter(n => !isNaN(n));
    const nextKeyNum = existingNumKeys.length > 0 ? Math.max(...existingNumKeys) + 1 : Object.keys(artBoards).length + 1;
    const newKey = String(nextKeyNum);
    const newBoard: ArticleBoardData = {
      id: newKey,
      display_name: `構成盤面 ${newKey}`,
      units: []
    };
    setArtBoards(prev => ({
      ...prev,
      [newKey]: newBoard
    }));
    setActiveBoardKey(newKey);
    setArtBoardUnits([]);
    setArtBoardDisplayName(`構成盤面 ${newKey}`);
    setArtMainCarryId('');
    setArtAttachBoard(true);
    setMessage({ text: `✨ 新しい構成盤面 [board: ${newKey}] を作成しました！` });
  };

  // Delete board
  const handleDeleteBoard = (keyToDelete: string) => {
    const keys = Object.keys(artBoards);
    if (keys.length <= 1) {
      alert('最低1つの盤面が必要です。削除できません。');
      return;
    }
    if (!window.confirm(`[board: ${keyToDelete}] を削除しますか？\n（本文中にタグがある場合は本文からも削除されます）`)) {
      return;
    }
    const updatedBoards = { ...artBoards };
    delete updatedBoards[keyToDelete];
    setArtBoards(updatedBoards);

    const remainingKeys = keys.filter(k => k !== keyToDelete);
    const nextKey = remainingKeys[0] || '1';
    handleSwitchActiveBoard(nextKey, updatedBoards);

    setArtContent(prev => prev.replaceAll(`[board: ${keyToDelete}]`, '').replaceAll(`[盤面: ${keyToDelete}]`, ''));
    setMessage({ text: `[board: ${keyToDelete}] を削除しました。` });
  };

  // File upload refs & drag drop state
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);
  const artContentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [isDraggingContent, setIsDraggingContent] = useState(false);

  // Champion & Item Pickers for Article Content
  const [champPickerOpen, setChampPickerOpen] = useState(false);
  const [champPickerSearch, setChampPickerSearch] = useState('');
  const [champPickerCost, setChampPickerCost] = useState<number | 'ALL'>('ALL');
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemPickerSearch, setItemPickerSearch] = useState('');

  // Insert short tag at current cursor position in content textarea
  const handleInsertTagAtCursor = (tag: string) => {
    const textarea = artContentTextareaRef.current;
    if (!textarea) {
      setArtContent(prev => prev + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    setArtContent(before + tag + after);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // Client-side canvas image resizer & compressor (Max width 900px, quality 0.70)
  const compressImage = (file: File, maxWidth = 900, quality = 0.70): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('画像ファイル (JPEG, PNG, WebP等) を選択してください'));
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      };
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    });
  };

  // Image Cropper State & Handlers
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperTarget, setCropperTarget] = useState<'COVER' | 'CONTENT'>('COVER');
  const [editingImageKey, setEditingImageKey] = useState<string | null>(null);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [cropperAspect, setCropperAspect] = useState<string>('16:9'); // '16:9' | '4:3' | '1:1' | 'FREE'
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleOpenCropperForFile = (file: File, target: 'COVER' | 'CONTENT', existingKey: string | null = null) => {
    if (!file.type.startsWith('image/')) {
      setMessage({ text: '画像ファイルを選択してください', isError: true });
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setCropperImageSrc(src);
      setCropperTarget(target);
      setEditingImageKey(existingKey);
      setCropperAspect(target === 'COVER' ? '16:9' : 'FREE');
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      setCropperOpen(true);
    };
  };

  const handleOpenCropperForSrc = (src: string, target: 'COVER' | 'CONTENT', existingKey: string | null = null) => {
    setCropperImageSrc(src);
    setCropperTarget(target);
    setEditingImageKey(existingKey);
    setCropperAspect(target === 'COVER' ? '16:9' : 'FREE');
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setCropperOpen(true);
  };

  // Convert inline Base64 images to short tags [画像: 1]
  const handleConvertInlineBase64ToShortTags = () => {
    let curImages: { [key: string]: string } = { ...artImages };
    let content = artContent;
    const base64Regex = /!\[(.*?)\]\((data:image\/[^\x29]+)\)/g;
    let match;
    let counter = 1;
    const replacements: { oldStr: string; newTag: string }[] = [];

    while ((match = base64Regex.exec(content)) !== null) {
      while (curImages[String(counter)]) counter++;
      const key = String(counter);
      curImages[key] = match[2];
      replacements.push({ oldStr: match[0], newTag: `[画像: ${key}]` });
      counter++;
    }

    if (replacements.length === 0) {
      // Also check standalone data:image/ lines
      const standaloneRegex = /(data:image\/[a-zA-Z0-9+/=;,-]+)/g;
      while ((match = standaloneRegex.exec(content)) !== null) {
        while (curImages[String(counter)]) counter++;
        const key = String(counter);
        curImages[key] = match[1];
        replacements.push({ oldStr: match[0], newTag: `[画像: ${key}]` });
        counter++;
      }
    }

    if (replacements.length > 0) {
      for (const r of replacements) {
        content = content.replace(r.oldStr, r.newTag);
      }
      setArtImages(curImages);
      setArtContent(content);
      setMessage({ text: `🪄 ${replacements.length}個の膨大な画像コードを短いタグ [画像: 番号] に変換・整理しました！` });
    } else {
      setMessage({ text: '変換対象の長い画像コードは見つかりませんでした。' });
    }
  };

  const handleApplyCrop = () => {
    if (!cropperImageSrc) return;
    const img = new Image();
    img.src = cropperImageSrc;
    img.onload = () => {
      let targetW = 900;
      let targetH = 506; // 16:9

      if (cropperAspect === '4:3') {
        targetH = 675;
      } else if (cropperAspect === '1:1') {
        targetH = 900;
      } else if (cropperAspect === 'FREE') {
        targetH = Math.round((targetW * img.height) / img.width);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);

      ctx.save();
      ctx.translate(targetW / 2 + pan.x, targetH / 2 + pan.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const scaleFit = Math.min(targetW / img.width, targetH / img.height);
      const drawW = img.width * scaleFit;
      const drawH = img.height * scaleFit;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.75);

      if (cropperTarget === 'COVER') {
        setArtCoverImage(croppedDataUrl);
        setMessage({ text: '✂️ アイキャッチ画像を拡大・縮小・切り取りして挿入しました！' });
      } else {
        if (editingImageKey) {
          // 既存キーの画像差し替え
          setArtImages(prev => ({ ...prev, [editingImageKey]: croppedDataUrl }));
          setMessage({ text: `✂️ [画像: ${editingImageKey}] を更新しました！` });
        } else {
          // 新規キーの発行
          let nextNum = 1;
          const currentKeys = Object.keys(artImages);
          while (currentKeys.includes(String(nextNum))) {
            nextNum++;
          }
          const nextKey = String(nextNum);
          setArtImages(prev => ({ ...prev, [nextKey]: croppedDataUrl }));
          setArtContent(prev => prev + (prev.endsWith('\n') ? '' : '\n') + `\n[画像: ${nextKey}]\n\n`);
          setMessage({ text: `✂️ 本文に短いタグ [画像: ${nextKey}] を挿入しました！下の画像一覧やプレビューで確認できます。` });
        }
      }

      setEditingImageKey(null);
      setCropperOpen(false);
    };
  };

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const sortCompsByTierAndName = (list: CompStat[]): CompStat[] => {
    const tierWeight: { [key: string]: number } = { OP: 1, S: 2, A: 3, B: 4, C: 5 };
    return [...list].sort((a, b) => {
      const weightA = tierWeight[a.tier?.toUpperCase()] || 99;
      const weightB = tierWeight[b.tier?.toUpperCase()] || 99;
      if (weightA !== weightB) return weightA - weightB;
      return (a.display_name || '').localeCompare(b.display_name || '', 'ja-JP');
    });
  };

  // 1. Fetch Champions, Items & Augments Master
  const fetchMasterData = async () => {
    // Load local Set 18 master data instantly
    setChampions(getAllChampions());
    setItems(getAllItems());
    setAugments(getAllAugments());

    try {
      const [cRes, iRes, aRes, compsRes] = await Promise.all([
        fetch('/api/champions'),
        fetch('/api/items'),
        fetch('/api/augments'),
        fetch(`/api/comps?queue_id=1160&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        })
      ]);

      if (cRes.ok) {
        const cData: ChampionMaster[] = await cRes.json();
        const uniqueMap = new Map<string, ChampionMaster>();
        cData.forEach(c => {
          if (c.name && !uniqueMap.has(c.name)) {
            uniqueMap.set(c.name, c);
          }
        });
        const uniqueList = Array.from(uniqueMap.values());
        uniqueList.sort((a, b) => {
          if (a.cost !== b.cost) return a.cost - b.cost;
          return a.name.localeCompare(b.name, 'ja-JP');
        });
        if (uniqueList.length > 0) setChampions(uniqueList);
      }
      if (iRes.ok) {
        const iData: Item[] = await iRes.json();
        const allMerged = [...getAllItems(), ...iData];
        const uniqueItems = new Map<string, Item>();
        allMerged.forEach(item => {
          if (item.name && !uniqueItems.has(item.name)) {
            const icon = getItemIcon(item.id || item.name) || item.icon;
            uniqueItems.set(item.name, { ...item, icon });
          }
        });
        setItems(Array.from(uniqueItems.values()));
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        const sortedAugs = [...aData].sort((a, b) => {
          const styleA = getAugmentTierStyle(a.name, a.tier);
          const styleB = getAugmentTierStyle(b.name, b.tier);
          const orderMap = { silver: 1, gold: 2, prismatic: 3 };
          const orderA = orderMap[styleA.tier];
          const orderB = orderMap[styleB.tier];
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name, 'ja-JP');
        });
        if (sortedAugs.length > 0) setAugments(sortedAugs);
      }
      let latestComps: CompStat[] = [];
      if (compsRes.ok) {
        const compsData = await compsRes.json();
        if (Array.isArray(compsData) && compsData.length > 0) {
          latestComps = sortCompsByTierAndName(compsData);
        } else {
          latestComps = sortCompsByTierAndName(FALLBACK_COMPS);
        }
      } else {
        latestComps = sortCompsByTierAndName(FALLBACK_COMPS);
      }
      setCompsList(latestComps);
      return latestComps;
    } catch (e) {
      console.error('Failed to load master data from API, using fallback:', e);
      const fallbackList = sortCompsByTierAndName(FALLBACK_COMPS);
      setCompsList(fallbackList);
      return fallbackList;
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchArticles();
  }, [authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const trimmed = passcode.trim();
    if (trimmed === 'admin123') {
      setAuthenticated(true);
      fetchMasterData();
      fetchArticles();
      return;
    }
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: trimmed })
      });
      if (res.ok) {
        setAuthenticated(true);
        fetchMasterData();
        fetchArticles();
      } else {
        const err = await res.json().catch(() => null);
        setAuthError(err?.detail || 'パスコードが正しくありません (デフォルト: admin123)');
      }
    } catch (e) {
      if (trimmed === 'admin123') {
        setAuthenticated(true);
        fetchMasterData();
        fetchArticles();
      } else {
        setAuthError('サーバー接続エラーが発生しました。パスコード(admin123)でログインしてください。');
      }
    }
  };

  // Populate Form when selecting existing comp
  const handleSelectComp = (key: string, listToUse: CompStat[] = compsList) => {
    setSelectedCompKey(key);
    setMessage(null);

    if (key === 'NEW') {
      setDisplayName('');
      setTier('S');
      setMainCarryId(champions.length > 0 ? champions[0].id : '');
      setTraitsSummary('');
      setRerollLevel('Standard');
      setOverview('');
      setPlayConditions('');
      setProgressionGuide('');
      setDedicatedAugment('');
      setSelectedAugments([]);
      setPartnerKeys([]);
      setBoardUnitsMap({ FINAL: [] });
      return;
    }

    const found = listToUse.find(c => c.comp_key === key);
    if (found) {
      setDisplayName(found.display_name);
      setTier(found.tier);
      setMainCarryId(found.main_carry.id);
      setTraitsSummary(found.traits_summary || '');
      setRerollLevel(found.reroll_level || 'Standard');
      setOverview(found.overview || '');
      setPlayConditions(found.play_conditions || '');
      setProgressionGuide(found.progression_guide || '');
      const existingPartners = (found.partner_comp_keys && found.partner_comp_keys.length > 0)
        ? found.partner_comp_keys
        : (found.partner_comps || []).map(p => p.comp_key);
      setPartnerKeys(existingPartners);

      // Hydrate selected augments
      const matchedAugs: AugmentMaster[] = (found.recommended_augments || []).map(augName => {
        const augObj = augments.find(a => a.name === augName || a.id === augName);
        return augObj || { id: augName, name: augName, icon: '' };
      });
      setSelectedAugments(matchedAugs);

      const boards: { [lvl: string]: UnitDetail[] } = {
        FINAL: found.units_detail || []
      };
      if (found.level_boards) {
        Object.entries(found.level_boards).forEach(([lvl, board]) => {
          boards[lvl] = board;
        });
      }
      setBoardUnitsMap(boards);
    }
  };

  // Auto Generate Traits Summary from Board
  const handleAutoGenerateTraits = () => {
    const finalUnits = boardUnitsMap['FINAL'] || [];
    if (finalUnits.length === 0) {
      setMessage({ text: '完成盤面にユニットが配置されていません', isError: true });
      return;
    }

    const { activeTraits } = calculateAllTeamTraits(finalUnits);
    const summaryStr = activeTraits.map(t => `${t.count} ${t.name}`).join(', ');
    setTraitsSummary(summaryStr);
    setMessage({ text: '盤面の駒から発動シナジー概要を自動生成しました！' });
  };

  // Fetch Articles with LocalStorage Merge
  const fetchArticles = async () => {
    let remoteArticles: Article[] = [];
    let backendSuccess = false;
    try {
      const res = await fetch(`/api/articles?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        remoteArticles = await res.json();
        backendSuccess = true;
      }
    } catch (e) {
      console.error('Failed to fetch articles from backend:', e);
    }

    let localArticles: Article[] = [];
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('tft_custom_articles') : null;
      if (saved) {
        localArticles = JSON.parse(saved);
      }
    } catch (e) {}

    let deletedIds: number[] = [];
    try {
      const delSaved = typeof window !== 'undefined' ? localStorage.getItem('tft_deleted_articles') : null;
      if (delSaved) {
        deletedIds = JSON.parse(delSaved);
      }
    } catch (e) {}

    const isTestArticle = (a: Article) =>
      a.title === 'TFT Set 18 ダブルアップ最新環境 ティアリスト＆連携戦術徹底解説' ||
      a.title === '今セット遊んでみた！おすすめネタ＆ロマン★3構成レポート';

    const mergedMap = new Map<number, Article>();
    const baseList = backendSuccess ? remoteArticles : (remoteArticles.length > 0 ? remoteArticles : FALLBACK_ARTICLES);
    baseList.forEach(a => {
      if (!deletedIds.includes(a.id) && !isTestArticle(a)) {
        mergedMap.set(a.id, a);
      }
    });
    localArticles.forEach(a => {
      if (!deletedIds.includes(a.id) && !isTestArticle(a)) {
        mergedMap.set(a.id, a);
      }
    });

    const resultList = Array.from(mergedMap.values()).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    setArticlesList(resultList);

    if (backendSuccess && localArticles.length > 0) {
      // Auto-sync local articles to backend DB & articles_seed.json
      fetch('/api/articles/batch_sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles: localArticles })
      }).catch(() => null);
    }

    return resultList;
  };

  const handleSyncArticlesToBackend = async () => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('tft_custom_articles') : null;
      let localArticles: Article[] = saved ? JSON.parse(saved) : [];
      let deletedIds: number[] = [];
      const delSaved = typeof window !== 'undefined' ? localStorage.getItem('tft_deleted_articles') : null;
      if (delSaved) deletedIds = JSON.parse(delSaved);

      localArticles = localArticles.filter(a => !deletedIds.includes(a.id));

      if (localArticles.length === 0) {
        setMessage({ text: '同期対象のローカル記事はありません（サーバーと同期済み）' });
        return;
      }

      const res = await fetch('/api/articles/batch_sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles: localArticles })
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({
          text: `☁️ ${data.synced_count || localArticles.length}件の記事をサーバーと本番用シード（articles_seed.json）へ同期しました！update_vps.bat で本番へ即座に反映可能です。`
        });
        await fetchArticles();
      } else {
        setMessage({
          text: '⚠️ サーバーへの同期に失敗しました。start_app.bat でバックエンドが起動しているかご確認ください。'
        });
      }
    } catch (e) {
      setMessage({
        text: '⚠️ バックエンドサーバーに接続できませんでした。start_app.bat でバックエンド（ポート8000）が起動しているかご確認ください。'
      });
    }
  };

  const handleSelectArticle = (artId: number | 'NEW', list = articlesList) => {
    setSelectedArticleId(artId);
    setMessage(null);
    setArtEditorTab('EDIT');
    if (artId === 'NEW') {
      setArtTitle('');
      setArtCategory('構成ガイド');
      setArtCoverImage('');
      setArtSummary('');
      setArtContent('');
      const defaultBoards: { [key: string]: ArticleBoardData } = {
        '1': { id: '1', display_name: '構成盤面 1', units: [] }
      };
      setArtBoards(defaultBoards);
      setActiveBoardKey('1');
      setArtAttachBoard(false);
      setArtBoardDisplayName('');
      setArtMainCarryId('');
      setArtBoardUnits([]);
      setArtImages({});
      setArtIsPublished(1);
    } else {
      const target = list.find(a => a.id === artId);
      if (target) {
        setArtTitle(target.title || '');
        setArtCategory(target.category || '構成ガイド');
        setArtCoverImage(target.cover_image || '');
        setArtSummary(target.summary || '');
        
        let curImages: { [key: string]: string } = { ...(target.images || target.board_data?.images || {}) };
        let content = target.content || '';

        // 本文内に含まれる膨大な Base64 画像 (![alt](data:image/...)) を自動的に [画像: N] に変換して整理
        const base64Regex = /!\[(.*?)\]\((data:image\/[^\x29]+)\)/g;
        let match;
        let counter = 1;
        const replacements: { oldStr: string; newTag: string }[] = [];
        while ((match = base64Regex.exec(content)) !== null) {
          while (curImages[String(counter)]) counter++;
          const key = String(counter);
          curImages[key] = match[2];
          replacements.push({ oldStr: match[0], newTag: `[画像: ${key}]` });
          counter++;
        }
        for (const r of replacements) {
          content = content.replace(r.oldStr, r.newTag);
        }

        setArtImages(curImages);
        setArtContent(content);

        // Multi-boards loading
        let loadedBoards: { [key: string]: ArticleBoardData } = {};
        if (target.boards && Object.keys(target.boards).length > 0) {
          loadedBoards = { ...target.boards };
        } else if (target.board_data && ((target.board_data.units && target.board_data.units.length > 0) || target.board_data.display_name)) {
          loadedBoards = {
            '1': { ...target.board_data, id: '1', display_name: target.board_data.display_name || '構成盤面 1' }
          };
        } else {
          loadedBoards = {
            '1': { id: '1', display_name: '構成盤面 1', units: [] }
          };
        }
        setArtBoards(loadedBoards);
        const firstKey = Object.keys(loadedBoards)[0] || '1';
        setActiveBoardKey(firstKey);

        const firstBoard = loadedBoards[firstKey] || { id: firstKey, display_name: '構成盤面 1', units: [] };
        const hasAnyUnits = Object.values(loadedBoards).some(b => (b.units && b.units.length > 0) || Boolean(b.display_name));
        setArtAttachBoard(hasAnyUnits);
        setArtBoardDisplayName(firstBoard.display_name || '');
        setArtMainCarryId(firstBoard.main_carry?.id || '');
        setArtBoardUnits(firstBoard.units || []);
        setArtIsPublished(target.is_published ?? 1);
      }
    }
  };

  const handleSaveArticle = async () => {
    if (!artTitle.trim()) {
      setMessage({ text: '記事タイトルは必須です', isError: true });
      return;
    }

    setSaving(true);
    setMessage(null);

    // Sync current active board edits into artBoards map
    const syncedBoards: { [key: string]: ArticleBoardData } = {
      ...artBoards,
      [activeBoardKey]: {
        ...(artBoards[activeBoardKey] || {}),
        id: activeBoardKey,
        display_name: artBoardDisplayName || `構成盤面 ${activeBoardKey}`,
        main_carry: artMainCarryId ? { id: artMainCarryId, name: artMainCarryId, cost: 4 } : undefined,
        units: artBoardUnits
      }
    };
    setArtBoards(syncedBoards);

    const activeBoardData = syncedBoards[activeBoardKey] || Object.values(syncedBoards)[0];
    const boardPayload = artAttachBoard ? {
      display_name: activeBoardData?.display_name || artTitle,
      main_carry: activeBoardData?.main_carry,
      units: activeBoardData?.units || [],
      images: artImages
    } : {
      images: artImages
    };

    const isNew = selectedArticleId === 'NEW';
    const targetId = isNew ? Date.now() : (selectedArticleId as number);
    const nowMs = Date.now();

    const payload: Article = {
      id: targetId,
      title: artTitle.trim(),
      category: artCategory,
      cover_image: artCoverImage,
      summary: artSummary,
      content: artContent,
      board_data: boardPayload,
      boards: artAttachBoard ? syncedBoards : {},
      images: artImages,
      is_published: artIsPublished,
      created_at: nowMs,
      updated_at: nowMs
    };

    let savedToBackend = false;

    try {
      const url = isNew ? '/api/articles' : `/api/articles/${selectedArticleId}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        savedToBackend = true;
        if (isNew && data.id) {
          payload.id = data.id;
        }
      }
    } catch (e: any) {
      console.error('Backend save error:', e);
    }

    // Always update LocalStorage as persistent local store / fallback
    try {
      const existingSaved = localStorage.getItem('tft_custom_articles');
      let customList: Article[] = existingSaved ? JSON.parse(existingSaved) : [];
      const idx = customList.findIndex(a => a.id === payload.id);
      if (idx >= 0) {
        customList[idx] = payload;
      } else {
        customList.push(payload);
      }
      localStorage.setItem('tft_custom_articles', JSON.stringify(customList));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }

    setMessage({
      text: savedToBackend
        ? (isNew ? '✨ 記事を新規公開・登録しました！（本番用シード自動同期済み）' : '💾 記事を更新・保存しました！（本番用シード自動同期済み）')
        : '⚠️ バックエンド未接続のためブラウザにのみ保存されました。start_app.batでバックエンドを起動して再度保存または「本番同期」を押してください。'
    });

    const freshArticles = await fetchArticles();
    handleSelectArticle(payload.id, freshArticles);
    setSaving(false);
  };

  const handleDeleteArticle = async (artId: number) => {
    if (!window.confirm('この記事を完全に削除しますか？')) return;
    setSaving(true);
    try {
      await fetch(`/api/articles/${artId}`, { method: 'DELETE' }).catch(() => null);
    } catch (e) {}

    try {
      const existingSaved = localStorage.getItem('tft_custom_articles');
      if (existingSaved) {
        let customList: Article[] = JSON.parse(existingSaved);
        customList = customList.filter(a => a.id !== artId);
        localStorage.setItem('tft_custom_articles', JSON.stringify(customList));
      }

      const delSaved = localStorage.getItem('tft_deleted_articles');
      const delList: number[] = delSaved ? JSON.parse(delSaved) : [];
      if (!delList.includes(artId)) {
        delList.push(artId);
      }
      // もし初期テスト記事のいずれかを削除した場合、両方のID(1, 2)も削除対象に含める
      if (artId === 1 || artId === 2) {
        if (!delList.includes(1)) delList.push(1);
        if (!delList.includes(2)) delList.push(2);
      }
      localStorage.setItem('tft_deleted_articles', JSON.stringify(delList));
    } catch (e) {}

    setMessage({ text: '記事を削除しました。' });
    const fresh = await fetchArticles();
    handleSelectArticle('NEW', fresh);
    setSaving(false);
  };

  // Cell Click -> Open Unit Editor
  const handleOpenCellEditor = (row: number, col: number, target: 'COMP' | 'ARTICLE' = 'COMP') => {
    setEditingCellTarget(target);
    setEditingCell({ row, col });

    const currentUnits = target === 'ARTICLE' ? artBoardUnits : (boardUnitsMap[currentLvlTab] || []);
    const existingUnit = currentUnits.find(u => u.row === row && u.col === col);

    if (existingUnit) {
      setSelectedChampForCell(existingUnit.id);
      setSelectedStarForCell(existingUnit.star || 2);
      setSelectedItemsForCell((existingUnit.items || []).map((i: any) => typeof i === 'string' ? i : (i.id || '')));
    } else {
      setSelectedChampForCell(champions.length > 0 ? champions[0].id : '');
      setSelectedStarForCell(2);
      setSelectedItemsForCell([]);
    }
  };

  // Save Unit to current level board or article board
  const handleSaveCellUnit = () => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const cinfo = champions.find(c => c.id === selectedChampForCell);
    if (!cinfo) return;

    const equippedItems: Item[] = selectedItemsForCell.map(itemId => {
      const iinfo = items.find(i => i.id === itemId || i.name === itemId);
      return {
        id: itemId,
        name: iinfo ? iinfo.name : itemId,
        icon: getItemIcon(itemId) || (iinfo ? iinfo.icon : '')
      };
    });

    const newUnit: UnitDetail = {
      id: cinfo.id,
      name: cinfo.name,
      cost: cinfo.cost,
      icon: cinfo.icon,
      role: 'ユニット',
      row,
      col,
      star: selectedStarForCell,
      traits: cinfo.traits || [],
      items: equippedItems
    };

    if (editingCellTarget === 'ARTICLE') {
      const filtered = artBoardUnits.filter(u => !(u.row === row && u.col === col));
      filtered.push(newUnit);
      setArtBoardUnits(filtered);
      setArtBoards(prev => {
        const curBoard = prev[activeBoardKey] || { id: activeBoardKey, display_name: `構成盤面 ${activeBoardKey}`, units: [] };
        return {
          ...prev,
          [activeBoardKey]: {
            ...curBoard,
            units: filtered
          }
        };
      });
    } else {
      const currentBoard = [...(boardUnitsMap[currentLvlTab] || [])];
      const filteredBoard = currentBoard.filter(u => !(u.row === row && u.col === col));
      filteredBoard.push(newUnit);

      const updatedMap = {
        ...boardUnitsMap,
        [currentLvlTab]: filteredBoard
      };
      setBoardUnitsMap(updatedMap);

      if (currentLvlTab === 'FINAL') {
        const { activeTraits } = calculateAllTeamTraits(filteredBoard);
        setTraitsSummary(activeTraits.map(t => `${t.count} ${t.name}`).join(', '));
      }
    }

    setEditingCell(null);
  };

  // Remove Unit from cell
  const handleRemoveCellUnit = () => {
    if (!editingCell) return;
    const { row, col } = editingCell;

    if (editingCellTarget === 'ARTICLE') {
      const filtered = artBoardUnits.filter(u => !(u.row === row && u.col === col));
      setArtBoardUnits(filtered);
      setArtBoards(prev => {
        const curBoard = prev[activeBoardKey] || { id: activeBoardKey, display_name: `構成盤面 ${activeBoardKey}`, units: [] };
        return {
          ...prev,
          [activeBoardKey]: {
            ...curBoard,
            units: filtered
          }
        };
      });
    } else {
      const currentBoard = [...(boardUnitsMap[currentLvlTab] || [])];
      const filteredBoard = currentBoard.filter(u => !(u.row === row && u.col === col));

      const updatedMap = {
        ...boardUnitsMap,
        [currentLvlTab]: filteredBoard
      };
      setBoardUnitsMap(updatedMap);

      if (currentLvlTab === 'FINAL') {
        const { activeTraits } = calculateAllTeamTraits(filteredBoard);
        setTraitsSummary(activeTraits.map(t => `${t.count} ${t.name}`).join(', '));
      }
    }

    setEditingCell(null);
  };

  // Instant real-time partner composition toggling (mutual linking on click)
  const handleTogglePartner = async (targetKey: string) => {
    const isCurrentlySelected = partnerKeys.includes(targetKey);
    const willBeSelected = !isCurrentlySelected;

    const nextPartnerKeys = willBeSelected
      ? [...partnerKeys, targetKey]
      : partnerKeys.filter(k => k !== targetKey);
    setPartnerKeys(nextPartnerKeys);

    if (!selectedCompKey || selectedCompKey === 'NEW') {
      return;
    }

    setCompsList(prevList => {
      return prevList.map(c => {
        if (c.comp_key === selectedCompKey) {
          return { ...c, partner_comp_keys: nextPartnerKeys };
        }
        if (c.comp_key === targetKey) {
          const currentTargetPartners = c.partner_comp_keys || [];
          const nextTargetPartners = willBeSelected
            ? (currentTargetPartners.includes(selectedCompKey) ? currentTargetPartners : [...currentTargetPartners, selectedCompKey])
            : currentTargetPartners.filter(k => k !== selectedCompKey);
          return { ...c, partner_comp_keys: nextTargetPartners };
        }
        return c;
      });
    });

    try {
      await fetch('/api/admin/toggle-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode,
          source_comp_key: selectedCompKey,
          target_comp_key: targetKey,
          is_selected: willBeSelected
        })
      });
    } catch (e) {
      console.error('Failed to toggle partner link:', e);
    }
  };

  // Auto select partner comps that share NO champions with the current edited board
  const handleAutoSelectNonOverlappingPartners = async () => {
    const normalizeChampKey = (rawIdOrName: string) => {
      if (!rawIdOrName) return '';
      return rawIdOrName
        .replace(/^DA_18_/, '')
        .replace(/^TFT18_/, '')
        .replace(/_AD$/, '')
        .replace(/_AP$/, '')
        .trim()
        .toLowerCase();
    };

    // 1. Gather all champion keys present on the current edited board
    const currentBoardUnits = boardUnitsMap['FINAL'] || [];
    const allBoardUnits = currentBoardUnits.length > 0 
      ? currentBoardUnits 
      : Object.values(boardUnitsMap).flat();

    if (allBoardUnits.length === 0 && !mainCarryId) {
      setMessage({
        text: '編集中の盤面にユニットが配置されていません。完成盤面を設定してから自動選択を実行してください。',
        isError: true
      });
      return;
    }

    const currentChampKeys = new Set<string>();
    allBoardUnits.forEach(u => {
      if (u.id) currentChampKeys.add(normalizeChampKey(u.id));
      if (u.name) currentChampKeys.add(u.name.trim().toLowerCase());
    });
    if (mainCarryId) {
      currentChampKeys.add(normalizeChampKey(mainCarryId));
    }

    // 2. Filter available target comps that have 0 overlapping champions
    const targetComps = compsList.filter(c => c.comp_key !== selectedCompKey);
    const nonOverlappingKeys: string[] = [];

    targetComps.forEach(targetComp => {
      const targetChampKeys = new Set<string>();
      
      // Main Carry
      if (targetComp.main_carry?.id) {
        targetChampKeys.add(normalizeChampKey(targetComp.main_carry.id));
      }
      if (targetComp.main_carry?.name) {
        targetChampKeys.add(targetComp.main_carry.name.trim().toLowerCase());
      }

      // Units detail
      if (targetComp.units_detail && Array.isArray(targetComp.units_detail)) {
        targetComp.units_detail.forEach((u: any) => {
          if (typeof u === 'string') {
            targetChampKeys.add(normalizeChampKey(u));
          } else if (u) {
            if (u.id) targetChampKeys.add(normalizeChampKey(u.id));
            if (u.name) targetChampKeys.add(u.name.trim().toLowerCase());
          }
        });
      }

      // Level boards
      if (targetComp.level_boards) {
        Object.values(targetComp.level_boards).forEach(board => {
          if (Array.isArray(board)) {
            board.forEach((u: any) => {
              if (typeof u === 'string') {
                targetChampKeys.add(normalizeChampKey(u));
              } else if (u) {
                if (u.id) targetChampKeys.add(normalizeChampKey(u.id));
                if (u.name) targetChampKeys.add(u.name.trim().toLowerCase());
              }
            });
          }
        });
      }

      // Check if there is any overlap
      const hasOverlap = Array.from(currentChampKeys).some(key => key && targetChampKeys.has(key));

      if (!hasOverlap) {
        nonOverlappingKeys.push(targetComp.comp_key);
      }
    });

    if (nonOverlappingKeys.length === 0) {
      setMessage({
        text: '他のすべての構成とチャンピオンが1体以上被っているため、被りなし構成は見つかりませんでした。',
        isError: true
      });
      return;
    }

    // 3. Merge non-overlapping keys with current partnerKeys
    const newlyAddedKeys = nonOverlappingKeys.filter(k => !partnerKeys.includes(k));
    const nextPartnerKeys = Array.from(new Set([...partnerKeys, ...nonOverlappingKeys]));

    setPartnerKeys(nextPartnerKeys);

    // 4. Update compsList React state
    if (selectedCompKey && selectedCompKey !== 'NEW') {
      setCompsList(prevList => {
        return prevList.map(c => {
          if (c.comp_key === selectedCompKey) {
            return { ...c, partner_comp_keys: nextPartnerKeys };
          }
          if (nonOverlappingKeys.includes(c.comp_key)) {
            const currentTargetPartners = c.partner_comp_keys || [];
            const nextTargetPartners = currentTargetPartners.includes(selectedCompKey)
              ? currentTargetPartners
              : [...currentTargetPartners, selectedCompKey];
            return { ...c, partner_comp_keys: nextTargetPartners };
          }
          return c;
        });
      });

      // 5. Send real-time toggle API calls for newly added keys
      try {
        await Promise.all(
          newlyAddedKeys.map(targetKey =>
            fetch('/api/admin/toggle-partner', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                passcode,
                source_comp_key: selectedCompKey,
                target_comp_key: targetKey,
                is_selected: true
              })
            })
          )
        );
      } catch (e) {
        console.error('Failed to auto toggle non-overlapping partner links:', e);
      }
    }

    setMessage({
      text: `✨ 盤面の駒と被りのない構成 ${nonOverlappingKeys.length} 件（新規追加: ${newlyAddedKeys.length}件）を自動選択してチェックを入れました！`
    });
  };


  // Submit Save Comp Form (isNew: true forces creation of a new comp at top of list)
  const handleSaveComp = async (isNew = false) => {
    if (!displayName.trim() || !mainCarryId) {
      setMessage({ text: '構成名とメインキャリーは必須です', isError: true });
      return;
    }

    setSaving(true);
    setMessage(null);

    const recAugmentsNames = selectedAugments.map(a => a.name);

    const levelBoardsPayload: { [lvl: string]: any[] } = {};
    Object.entries(boardUnitsMap).forEach(([lvl, units]) => {
      if (lvl !== 'FINAL' && units.length > 0) {
        levelBoardsPayload[lvl] = units.map(u => ({
          id: u.id,
          role: u.role,
          row: u.row,
          col: u.col,
          star: u.star,
          items: (u.items || []).map((i: any) => typeof i === 'string' ? i : (i.id || ''))
        }));
      }
    });

    const finalUnitsPayload = (boardUnitsMap['FINAL'] || []).map(u => ({
      id: u.id,
      role: u.role,
      row: u.row,
      col: u.col,
      star: u.star,
      items: (u.items || []).map((i: any) => typeof i === 'string' ? i : (i.id || ''))
    }));

    const targetCompKey = isNew || selectedCompKey === 'NEW' ? null : selectedCompKey;

    const payload = {
      passcode,
      comp_key: targetCompKey,
      queue_id: 1160,
      display_name: displayName,
      tier,
      main_carry_id: mainCarryId,
      traits_summary: traitsSummary,
      reroll_level: rerollLevel,
      overview,
      play_conditions: playConditions,
      progression_guide: progressionGuide,
      dedicated_augment: dedicatedAugment,
      recommended_augments: recAugmentsNames,
      units_detail: finalUnitsPayload,
      level_boards: levelBoardsPayload,
      partner_comp_keys: partnerKeys
    };

    try {
      const res = await fetch('/api/admin/comps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({
          text: isNew || selectedCompKey === 'NEW'
            ? '✨ 新規チーム構成を登録しました！（ティア順・五十音順に自動整列）'
            : '💾 選択中のチーム構成を保存しました！（ティア順・五十音順に自動整列）'
        });
        const freshComps = await fetchMasterData();
        const savedKey = data.comp_key || targetCompKey;
        if (savedKey) {
          handleSelectComp(savedKey, freshComps);
        }
      } else {
        let errorDetail = `保存に失敗しました (HTTP ${res.status})`;
        try {
          const err = await res.json();
          if (typeof err.detail === 'string') {
            errorDetail = err.detail;
          } else if (Array.isArray(err.detail)) {
            errorDetail = err.detail.map((d: any) => `${d.loc?.join('.') || 'param'}: ${d.msg}`).join(', ');
          } else if (err.error) {
            errorDetail = err.error;
          }
        } catch {
          errorDetail = `サーバーエラーが発生しました (HTTP ${res.status}: ${res.statusText || 'エラー'})`;
        }
        setMessage({ text: errorDetail, isError: true });
      }
    } catch (e: any) {
      console.error('Save comp network error:', e);
      setMessage({ text: `サーバー通信エラーが発生しました (${e?.message || 'バックエンドに接続できません'})`, isError: true });
    } finally {
      setSaving(false);
    }
  };

  // Delete Comp
  const handleDeleteComp = async () => {
    if (selectedCompKey === 'NEW') return;
    if (!confirm(`構成「${displayName}」を完全に削除しますか？`)) return;

    try {
      const res = await fetch(`/api/admin/comps/${selectedCompKey}?passcode=${passcode}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessage({ text: '構成を削除しました' });
        await fetchMasterData();
        handleSelectComp('NEW');
      } else {
        let errDetail = '構成の削除に失敗しました';
        try {
          const err = await res.json();
          if (typeof err.detail === 'string') errDetail = err.detail;
        } catch {
          errDetail = `エラー (HTTP ${res.status})`;
        }
        setMessage({ text: errDetail, isError: true });
      }
    } catch (e: any) {
      console.error('Delete comp network error:', e);
      setMessage({ text: `サーバー通信エラーが発生しました (${e?.message || 'バックエンドに接続できません'})`, isError: true });
    }
  };



  // Hex Board Unit Drag & Drop State & Handlers
  const [draggedHex, setDraggedHex] = useState<{ row: number; col: number } | null>(null);
  const [hoveredHex, setHoveredHex] = useState<{ row: number; col: number } | null>(null);

  const handleHexDragStart = (e: React.DragEvent, row: number, col: number) => {
    e.stopPropagation();
    setDraggedHex({ row, col });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ row, col }));
  };

  const handleHexDragOver = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredHex?.row !== row || hoveredHex?.col !== col) {
      setHoveredHex({ row, col });
    }
  };

  const handleHexDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleHexDrop = (e: React.DragEvent, targetRow: number, targetCol: number) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredHex(null);

    if (!draggedHex) return;
    const { row: sourceRow, col: sourceCol } = draggedHex;
    if (sourceRow === targetRow && sourceCol === targetCol) {
      setDraggedHex(null);
      return;
    }

    const currentBoard = boardUnitsMap[currentLvlTab] || [];
    const sourceUnitIndex = currentBoard.findIndex(u => u.row === sourceRow && u.col === sourceCol);
    if (sourceUnitIndex === -1) {
      setDraggedHex(null);
      return;
    }

    const updatedBoard = [...currentBoard];
    const targetUnitIndex = updatedBoard.findIndex(u => u.row === targetRow && u.col === targetCol);

    const sourceUnit = { ...updatedBoard[sourceUnitIndex], row: targetRow, col: targetCol };

    if (targetUnitIndex !== -1) {
      // Swap champions between target and source hex cells
      const targetUnit = { ...updatedBoard[targetUnitIndex], row: sourceRow, col: sourceCol };
      updatedBoard[sourceUnitIndex] = targetUnit;
      updatedBoard[targetUnitIndex] = sourceUnit;
    } else {
      // Move champion to empty target hex cell
      updatedBoard[sourceUnitIndex] = sourceUnit;
    }

    setBoardUnitsMap(prev => ({
      ...prev,
      [currentLvlTab]: updatedBoard
    }));

    if (currentLvlTab === 'FINAL') {
      const { activeTraits } = calculateAllTeamTraits(updatedBoard);
      setTraitsSummary(activeTraits.map(t => `${t.count} ${t.name}`).join(', '));
    }

    setDraggedHex(null);
  };

  const handleHexDragEnd = () => {
    setDraggedHex(null);
    setHoveredHex(null);
  };

  const getCostStyle = (cost: number, isSelected: boolean) => {
    if (isSelected) {
      return 'border-sky-500 bg-sky-500/20 text-sky-900 font-black shadow-md ring-2 ring-sky-400';
    }
    switch (cost) {
      case 5:
        return 'border-amber-400/80 bg-amber-50 text-amber-900 hover:border-amber-400 shadow-sm';
      case 4:
        return 'border-purple-300 bg-purple-50 text-purple-900 hover:border-purple-400';
      case 3:
        return 'border-sky-300 bg-sky-50 text-sky-900 hover:border-sky-400';
      case 2:
        return 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:border-emerald-400';
      default:
        return 'border-sky-200 bg-sky-50/50 text-slate-700 hover:border-sky-300';
    }
  };

  // Render Passcode Screen if not authenticated
  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-sky-50 via-cyan-50/30 to-white">
        <div className="w-full max-w-md bg-white/90 border border-sky-200/80 rounded-2xl p-6 shadow-xl shadow-sky-500/10 space-y-5 backdrop-blur-md">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">管理者 ログイン</h1>
            <p className="text-xs text-slate-500">
              Web作成者専用 チーム構成データ管理・登録ポータル
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">管理者パスコード</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="パスコードを入力 (初期: admin123)"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" /> {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-black text-sm hover:opacity-90 transition shadow-md shadow-sky-500/25"
            >
              ログインして管理画面へ
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-slate-500 hover:text-sky-600 transition flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> トップページに戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentBoardUnits = boardUnitsMap[currentLvlTab] || [];
  const levelTabs = ['FINAL', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <main className="min-h-screen pb-20 bg-slate-50/50 text-slate-800">
      
      {/* Header Bar */}
      <header className="border-b border-sky-200/80 bg-white/85 sticky top-0 z-40 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-slate-600 hover:text-sky-600 hover:bg-sky-100/60 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-600" />
                DoubleUp.GG チーム構成登録・管理ポータル
              </h1>
              <span className="text-[11px] text-sky-600 font-bold">Web作成者 編集権限モード有効</span>
            </div>
          </div>

          <button
            onClick={() => setAuthenticated(false)}
            className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-bold text-slate-700 transition"
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Top Admin Mode Tab Switcher */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-sky-200 shadow-xs">
          <button
            onClick={() => setAdminTab('COMPS')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              adminTab === 'COMPS'
                ? 'bg-sky-500 text-white shadow-md font-black'
                : 'text-slate-700 hover:bg-sky-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>チーム構成データ管理 ({compsList.length}件)</span>
          </button>
          <button
            onClick={() => setAdminTab('ARTICLES')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              adminTab === 'ARTICLES'
                ? 'bg-sky-500 text-white shadow-md font-black'
                : 'text-slate-700 hover:bg-sky-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>記事・ブログ管理 ({articlesList.length}件)</span>
          </button>
        </div>

        {/* Notification Banner */}
        {message && (
          <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            message.isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {adminTab === 'COMPS' ? (
        /* ==========================================
           100% ORIGINAL COMP MANAGEMENT GRID
           ========================================== */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Registered Comps List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>登録済み構成一覧</span>
              <span className="text-[10px] text-slate-400">({compsList.length}件)</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/reset-seed', { method: 'POST' });
                    if (res.ok) {
                      const fresh = await res.json();
                      const sorted = sortCompsByTierAndName(fresh);
                      setCompsList(sorted);
                      setMessage({ text: '✨ 登録構成データを再読み込み・復元しました！' });
                    } else {
                      fetchMasterData();
                    }
                  } catch (e) {
                    fetchMasterData();
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-100 transition shadow-xs"
                title="初期登録構成データを全件再読み込み・復元"
              >
                🔄 データ全件復元
              </button>
              <button
                onClick={() => handleSelectComp('NEW')}
                className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-300 text-xs font-bold flex items-center gap-1 hover:bg-sky-100 transition"
              >
                <Plus className="w-3.5 h-3.5" /> 新規
              </button>
            </div>
          </div>

          <p className="text-[10px] text-sky-700 bg-sky-50/80 p-2 rounded-lg border border-sky-200 shadow-sm flex items-center gap-1 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            ティア順（OP → S → A → B → C）かつ五十音順に自動ソート
          </p>

          {compsList.length === 0 && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/90 text-amber-900 space-y-2 text-xs font-bold shadow-xs">
              <p className="flex items-center gap-1 text-[11px]">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                登録構成データがまだ読み込まれていません
              </p>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/reset-seed', { method: 'POST' });
                    if (res.ok) {
                      const fresh = await res.json();
                      setCompsList(sortCompsByTierAndName(fresh));
                      setMessage({ text: '✨ 登録構成データを復元しました！' });
                    } else {
                      fetchMasterData();
                    }
                  } catch (e) {
                    fetchMasterData();
                  }
                }}
                className="w-full py-2 rounded-lg bg-amber-600 text-white font-black text-xs hover:bg-amber-700 transition shadow-xs"
              >
                ✨ 構成データを全件ロード・復元する
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            <button
              onClick={() => handleSelectComp('NEW')}
              className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                selectedCompKey === 'NEW'
                  ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold shadow-sm'
                  : 'border-sky-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/50'
              }`}
            >
              <span className="text-xs flex items-center gap-2 font-bold">
                <Plus className="w-4 h-4 text-sky-600" /> ✨ 【新規追加】構成を登録
              </span>
            </button>

            {compsList.map((c, index) => {
              const isSelected = selectedCompKey === c.comp_key;
              return (
                <div
                  key={c.comp_key}
                  className={`group relative rounded-xl border transition flex items-center justify-between p-2.5 gap-2 ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/90 shadow-sm ring-1 ring-sky-500/30'
                      : 'border-sky-200/80 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50/40'
                  }`}
                >
                  {/* Comp Title & Info Click Target */}
                  <button
                    type="button"
                    onClick={() => handleSelectComp(c.comp_key)}
                    className="flex-1 text-left flex items-center justify-between min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 border border-slate-200" title={`登録表示順: 第${index + 1}位`}>
                        #{index + 1}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border shrink-0 ${getTierStyle(c.tier).badge}`}>
                        {c.tier}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">{c.display_name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{c.main_carry.name} キャリー</div>
                      </div>
                    </div>

                    {c.is_custom === 1 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 ml-1 font-bold">手動</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Interactive Editor Form */}
        <div className="lg:col-span-3 space-y-6">
          
          {message && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
              message.isError
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{message.text}</span>
            </div>
          )}

          <div className="p-6 bg-white rounded-2xl border border-sky-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-sky-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  {selectedCompKey === 'NEW' ? '新しいチーム構成の作成' : `構成編集: ${displayName}`}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  盤面配置、レベル別戦略、専用オーグメント、相性の良い構成を選択登録できます
                </p>
              </div>

              {selectedCompKey !== 'NEW' && (
                <button
                  onClick={handleDeleteComp}
                  className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1 hover:bg-red-100 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 構成削除
                </button>
              )}
            </div>

            {/* Basic Info Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">構成表示名 *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例: 6 エルダーウッド エズリアル & ザヤ"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tier ランク</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                >
                  <option value="OP">OP Tier (最強)</option>
                  <option value="S">S Tier (上位)</option>
                  <option value="A">A Tier (良好)</option>
                  <option value="B">B Tier (平均)</option>
                  <option value="C">C Tier (控えめ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">メインキャリー *</label>
                <select
                  value={mainCarryId}
                  onChange={(e) => setMainCarryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                >
                  {champions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (コスト {c.cost})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">リロールレベル設定</label>
                <select
                  value={rerollLevel}
                  onChange={(e) => setRerollLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                >
                  <option value="Standard">Standard (標準8到達)</option>
                  <option value="5リロール">5リロール (Lv5スロー)</option>
                  <option value="6リロール">6リロール (Lv6スロー)</option>
                  <option value="7リロール">7リロール (Lv7スロー)</option>
                  <option value="8リロール">8リロール (Lv8完結)</option>
                  <option value="Fast 8">Fast 8 (最速8ラッシュ)</option>
                  <option value="Fast 9">Fast 9 (最速9全開)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">主要シナジー概要</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateTraits}
                    className="text-[10px] text-sky-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-500" /> 盤面の駒から自動抽出
                  </button>
                </div>
                <input
                  type="text"
                  value={traitsSummary}
                  onChange={(e) => setTraitsSummary(e.target.value)}
                  placeholder="例: 6 エルダーウッド, 2 ヴァンガード, 2 ラピッドファイア"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Level-based Interactive Board Editor */}
            <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-sky-200/60 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Grid className="w-4 h-4 text-sky-600" /> プレイヤーレベル別 4×7 盤面配置エディタ
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    マスを<strong className="text-sky-700 font-bold">ドラッグ＆ドロップ</strong>して配置位置の移動・入れ替えが可能です。マスをクリックで詳細（星数・装備）を編集します。
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-sky-200 shadow-sm">
                  {levelTabs.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCurrentLvlTab(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        currentLvlTab === lvl
                          ? 'bg-sky-500 text-white font-black shadow-sm'
                          : 'text-slate-600 hover:bg-sky-50'
                      }`}
                    >
                      {lvl === 'FINAL' ? '完成盤面' : `Lv.${lvl}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4x7 Hex Grid */}
              <div className="min-w-[600px] py-4 px-2 overflow-x-auto select-none flex flex-col items-center justify-center">
                <div className="flex flex-col items-start">
                  {[0, 1, 2, 3].map((rowIdx) => {
                    const isOffset = rowIdx % 2 === 1;
                    const marginTopClass = rowIdx > 0 ? '-mt-[18px]' : '';
                    return (
                      <div
                        key={rowIdx}
                        className={`flex items-center gap-[4px] ${marginTopClass} ${
                          isOffset ? 'pl-[40px]' : ''
                        }`}
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map((colIdx) => {
                          const unit = currentBoardUnits.find(
                            u => u.row === rowIdx && u.col === colIdx
                          );
                          const isDraggingThis = draggedHex?.row === rowIdx && draggedHex?.col === colIdx;
                          const isHoveredTarget = hoveredHex?.row === rowIdx && hoveredHex?.col === colIdx;
                          const displayCost = resolveUnitCost(unit);

                          return (
                            <div
                              key={colIdx}
                              draggable={!!unit}
                              onDragStart={(e) => unit && handleHexDragStart(e, rowIdx, colIdx)}
                              onDragOver={(e) => handleHexDragOver(e, rowIdx, colIdx)}
                              onDragLeave={handleHexDragLeave}
                              onDrop={(e) => handleHexDrop(e, rowIdx, colIdx)}
                              onDragEnd={handleHexDragEnd}
                              onClick={() => {
                                if (!draggedHex) {
                                  handleOpenCellEditor(rowIdx, colIdx);
                                }
                              }}
                              className={`relative w-[76px] h-[88px] shrink-0 group transition-transform duration-200 cursor-pointer ${
                                isHoveredTarget
                                  ? 'scale-110 z-40'
                                  : isDraggingThis
                                  ? 'opacity-40 scale-95 z-20'
                                  : 'hover:scale-105 hover:z-30'
                              }`}
                              title={unit ? `${unit.name} (ドラッグで移動・入れ替え / クリックで編集)` : 'クリックでユニット追加'}
                            >
                              {/* Outer Pointy-Topped Hexagon */}
                              <div
                                style={
                                  isHoveredTarget
                                    ? {
                                        background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
                                        boxShadow: '0 0 16px rgba(16, 185, 129, 0.95)',
                                      }
                                    : unit
                                    ? getCostBorderStyle(displayCost)
                                    : undefined
                                }
                                className={`w-full h-full p-[3.5px] transition-all duration-200 ${hexClipPath} ${
                                  isHoveredTarget
                                    ? 'animate-pulse ring-2 ring-emerald-400'
                                    : unit
                                    ? ''
                                    : 'bg-sky-200/80 hover:bg-sky-400/90'
                                }`}
                              >
                                {/* Inner Hexagon Container */}
                                <div
                                  className={`w-full h-full relative overflow-hidden flex flex-col items-center justify-center ${hexClipPath} ${
                                    unit ? 'bg-slate-900' : 'bg-white hover:bg-sky-50'
                                  }`}
                                >
                                  {unit ? (() => {
                                    const champIcon = unit.icon || getChampionIcon(unit.id || unit.name) || getChampion(unit.id || unit.name)?.icon;
                                    const champName = unit.name || getChampionName(unit.id) || unit.id;
                                    return (
                                      <>
                                        {/* Star Badges inside top peak */}
                                        {renderStars(unit.star || 1, displayCost)}

                                        {/* Champion Portrait */}
                                        {champIcon ? (
                                          <img
                                            src={champIcon}
                                            alt={champName}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 pointer-events-none"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = getChampionIcon(champName);
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 pointer-events-none">
                                            {champName}
                                          </div>
                                        )}

                                        {/* Dark Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent pointer-events-none" />

                                        {/* Champion Name */}
                                        <span className="absolute top-[52%] -translate-y-1/2 inset-x-0 px-0.5 text-[11px] font-black text-white text-center leading-tight tracking-tight truncate drop-shadow-[0_1.5px_3px_rgba(0,0,0,1)] z-10 pointer-events-none">
                                          {champName}
                                        </span>
                                      </>
                                    );
                                  })() : (
                                    <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none text-sky-500 hover:text-sky-600">
                                      <span className="text-xs font-bold font-mono">+ 配置</span>
                                      <span className="text-[9px] font-mono opacity-60">({rowIdx + 1}-{colIdx + 1})</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Equipped Item Icons */}
                              {unit && unit.items && unit.items.length > 0 && (
                                <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-0.5 pointer-events-none">
                                  {unit.items.slice(0, 3).map((item: any, iIdx: number) => {
                                    const itemKey = typeof item === 'string' ? item : (item.id || item.name);
                                    const itemIconSrc = (typeof item === 'object' && item.icon) ? item.icon : getItemIcon(itemKey);
                                    const itemName = (typeof item === 'object' && item.name) ? item.name : itemKey;
                                    return itemIconSrc ? (
                                      <div
                                        key={iIdx}
                                        className="w-[20px] h-[20px] rounded-[3px] border border-slate-950 shadow-lg overflow-hidden bg-slate-950 shrink-0 ring-1 ring-black/60"
                                      >
                                        <img
                                          src={itemIconSrc}
                                          alt={itemName}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Strategy & Augments Master Selector */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">構成概要・強み</label>
                <textarea
                  rows={2}
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  placeholder="例: 高コスト物理キャリーを軸にした高火力構成。エルダーウッドのバフとヘカリムのタンク性能で時間を稼ぎます。"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {/* Augment Selection Section */}
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    推奨・専用オーグメント マスター選択
                  </h3>
                  <span className="text-[10px] text-slate-500">選択済み: {selectedAugments.length} 件</span>
                </div>

                {/* Selected Augments Badges */}
                {selectedAugments.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-2 bg-white rounded-xl border border-sky-200">
                    {selectedAugments.map((aug) => {
                      const isDedicated = dedicatedAugment === aug.name;
                      const style = getAugmentTierStyle(aug.name, aug.tier);
                      return (
                        <div
                          key={aug.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition ${style.glow} ${
                            isDedicated
                              ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-400/60'
                              : `${style.cardSelectedBorder} ${style.cardSelectedBg} ${style.cardSelectedText}`
                          }`}
                        >
                          <span className={`px-1.5 py-0.5 text-[9px] rounded shrink-0 ${style.badgeBg}`}>
                            {style.label}
                          </span>
                          <ItemIcon id={aug.id} name={aug.name} size="xs" />
                          <span className="font-extrabold">{aug.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isDedicated) setDedicatedAugment('');
                              else setDedicatedAugment(aug.name);
                            }}
                            title="専用/キーオーグメントに設定"
                            className={`p-1 rounded hover:bg-sky-100 text-[10px] ${
                              isDedicated ? 'text-amber-600 font-extrabold bg-amber-100 border border-amber-300' : 'text-slate-500 hover:text-amber-600'
                            }`}
                          >
                            {isDedicated ? '★ 専用' : '★ 専用に設定'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAugments(selectedAugments.filter(a => a.id !== aug.id));
                              if (isDedicated) setDedicatedAugment('');
                            }}
                            className="p-0.5 rounded hover:bg-sky-100 text-slate-400 hover:text-slate-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">下のリストから推奨オーグメントを選択してください。</p>
                )}

                {/* Augment Master Picker */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={augmentSearchQuery}
                    onChange={(e) => setAugmentSearchQuery(e.target.value)}
                    placeholder="オーグメント名で検索 (例: ジュエルロータス, 紋章, クラウン)..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-sky-200 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto p-1 bg-white rounded-xl border border-sky-200">
                    {augments
                      .filter(a => !augmentSearchQuery || a.name.toLowerCase().includes(augmentSearchQuery.toLowerCase()))
                      .map((aug) => {
                        const isSelected = selectedAugments.some(sa => sa.id === aug.id);
                        const style = getAugmentTierStyle(aug.name, aug.tier);
                        return (
                          <button
                            key={aug.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAugments(selectedAugments.filter(sa => sa.id !== aug.id));
                              } else {
                                setSelectedAugments([...selectedAugments, aug]);
                              }
                            }}
                            className={`p-2 rounded-xl border text-left transition flex items-center justify-between gap-1.5 ${
                              isSelected
                                ? `${style.cardSelectedBorder} ${style.cardSelectedBg} ${style.cardSelectedText} ${style.glow}`
                                : `${style.cardBorder} ${style.cardBg} ${style.cardText}`
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <ItemIcon id={aug.id} name={aug.name} size="xs" />
                              <span className={`text-[11px] truncate font-extrabold ${isSelected ? style.cardSelectedText : style.cardText}`}>{aug.name}</span>
                            </div>
                            <span className={`px-1.5 py-0.5 text-[9px] rounded shrink-0 ${style.badgeBg}`}>
                              {style.label}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">プレイ条件・挑戦タイミング</label>
                <input
                  type="text"
                  value={playConditions}
                  onChange={(e) => setPlayConditions(e.target.value)}
                  placeholder="例: 初期にADアイテム（大剣・弓）が多く落ちた時、または紋章を獲得できた時。"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">進行の説明 (序盤〜終盤のレベルアップ・リロール解説)</label>
                <textarea
                  rows={4}
                  value={progressionGuide}
                  onChange={(e) => setProgressionGuide(e.target.value)}
                  placeholder={'序盤(Lv3-5): コブコ・リリアで前衛を構築しADアイテムを進行持たせ。\n中盤(Lv6-7): Lv7でヘカリムを引き前衛を強化。\n終盤(Lv8): Lv8でメインキャリー★2を揃えて完成。'}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-slate-900 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 font-sans"
                />
              </div>

              {/* Partner Comps Selector */}
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    ダブルアップ 相性が良い構成の紐付け選択
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoSelectNonOverlappingPartners}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm"
                      title="編集中の盤面と同一チャンピオンを1体も含まない構成を自動チェック"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      ⚡ 駒被りなし構成を自動選択
                    </button>
                    <span className="text-[10px] text-slate-500 font-bold">ペア選択数: {partnerKeys.length} 件</span>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                  ✨ 相手側の構成のベストマッチリストにも相互で自動反映（追加・削除）されます。「⚡ 駒被りなし構成を自動選択」ボタンで駒の被りがないペアを一括チェックできます。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {compsList
                    .filter(c => c.comp_key !== selectedCompKey)
                    .map((p) => {
                      const isSelected = partnerKeys.includes(p.comp_key);
                      return (
                        <div
                          key={p.comp_key}
                          onClick={() => handleTogglePartner(p.comp_key)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                              : 'border-sky-200 bg-white text-slate-700 hover:border-sky-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${getTierStyle(p.tier).badge}`}>
                              {p.tier}
                            </span>
                            <span className="text-xs truncate max-w-[180px] font-medium">{p.display_name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>

            {/* Save Buttons Bar */}
            <div className="pt-4 border-t border-sky-100 flex flex-wrap items-center justify-end gap-3">
              {selectedCompKey !== 'NEW' ? (
                <>
                  {/* ボタン 1: 上書き保存 */}
                  <button
                    type="button"
                    onClick={() => handleSaveComp(false)}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-extrabold text-xs hover:bg-sky-700 transition flex items-center gap-2 shadow-md shadow-sky-500/20 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? '保存中...' : '💾 構成を保存（自動ソート）'}
                  </button>

                  {/* ボタン 2: 新規登録 */}
                  <button
                    type="button"
                    onClick={() => handleSaveComp(true)}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition flex items-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {saving ? '登録中...' : '✨ 新規構成として登録（自動ソート）'}
                  </button>
                </>
              ) : (
                /* 新規作成モードの場合 */
                <button
                  type="button"
                  onClick={() => handleSaveComp(true)}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs hover:opacity-90 transition flex items-center gap-2 shadow-md shadow-emerald-500/25 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {saving ? '登録中...' : '✨ 新規チーム構成を登録（自動ソート）'}
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
      ) : (
        /* ==========================================
           ARTICLES MANAGEMENT TAB
           ========================================== */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column: Articles List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>公開記事一覧</span>
                <span className="text-[10px] text-slate-400">({articlesList.length}件)</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSyncArticlesToBackend}
                  title="ローカル記事をサーバーDBと本番用シード（articles_seed.json）に一括同期します"
                  className="px-2 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 transition shadow-xs"
                >
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>本番同期</span>
                </button>
                <button
                  onClick={() => handleSelectArticle('NEW')}
                  className="px-2.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-300 text-xs font-bold flex items-center gap-1 hover:bg-sky-100 transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> 新規記事
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
              <button
                onClick={() => handleSelectArticle('NEW')}
                className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                  selectedArticleId === 'NEW'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold shadow-sm'
                    : 'border-sky-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/50'
                }`}
              >
                <span className="text-xs flex items-center gap-2 font-bold">
                  <Plus className="w-4 h-4 text-sky-600" /> ✨ 新しい記事を執筆
                </span>
              </button>

              {articlesList.map((art) => {
                const isSelected = selectedArticleId === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => handleSelectArticle(art.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition space-y-1 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/90 shadow-sm ring-1 ring-sky-500/30 font-bold'
                        : 'border-sky-200/80 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-700 font-black">
                        {art.category}
                      </span>
                      {art.is_published ? (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Eye className="w-3 h-3" /> 公開中
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                          <EyeOff className="w-3 h-3" /> 下書き
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-xs line-clamp-1 text-slate-900">
                      {art.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 line-clamp-1">
                      {art.summary || 'サマリーなし'}
                    </p>
                  </div>
                );
              })}

              {articlesList.length === 0 && (
                <div className="text-center py-6 px-3 bg-sky-50/50 rounded-xl border border-dashed border-sky-200 text-slate-400 text-xs">
                  投稿された記事はありません
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Article Editor Form */}
          <div className="lg:col-span-3 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl border border-sky-200/80 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between border-b border-sky-100 pb-4">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-600" />
                  <span>{selectedArticleId === 'NEW' ? '新規記事の執筆' : '記事の編集'}</span>
                </h2>
                <div className="flex items-center gap-2">
                  {selectedArticleId !== 'NEW' && (
                    <button
                      onClick={() => handleDeleteArticle(Number(selectedArticleId))}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 記事を削除
                    </button>
                  )}
                  <button
                    onClick={handleSaveArticle}
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-black text-xs hover:opacity-90 transition shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? '保存中...' : '記事を保存・公開'}</span>
                  </button>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">記事タイトル *</label>
                  <input
                    type="text"
                    value={artTitle}
                    onChange={(e) => setArtTitle(e.target.value)}
                    placeholder="例: Set 18 ダブルアップおすすめメタ構成＆連携立ち回り解説"
                    className="w-full px-3.5 py-2 rounded-xl border border-sky-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">カテゴリ</label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-sky-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  >
                    <option value="構成ガイド">構成ガイド</option>
                    <option value="アプデ・ニュース">アプデ・ニュース</option>
                    <option value="プレイ日記">プレイ日記</option>
                    <option value="サーバー・システム">サーバー・システム</option>
                  </select>
                </div>
              </div>

              {/* Cover Image & Summary with File Picker + Drag & Drop */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">アイキャッチ画像 (ファイル選択 / ドラッグ＆ドロップ / URL)</label>
                  {artCoverImage && (
                    <button
                      type="button"
                      onClick={() => setArtCoverImage('')}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> 画像を削除
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Drag & Drop Upload Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingCover(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingCover(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingCover(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleOpenCropperForFile(e.dataTransfer.files[0], 'COVER');
                      }
                    }}
                    onClick={() => coverFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[100px] ${
                      isDraggingCover
                        ? 'border-sky-500 bg-sky-100/80 scale-[1.01]'
                        : 'border-sky-200 bg-sky-50/50 hover:bg-sky-50 hover:border-sky-300'
                    }`}
                  >
                    <input
                      type="file"
                      ref={coverFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleOpenCropperForFile(e.target.files[0], 'COVER');
                        }
                      }}
                    />
                    <Upload className="w-5 h-5 text-sky-600 mb-1" />
                    <p className="text-xs font-bold text-slate-700">ファイルを選択 または ここにドロップ</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, WebP (拡大・縮小・切り取り対応)</p>
                  </div>

                  {/* URL Input & Live Preview */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={artCoverImage}
                      onChange={(e) => setArtCoverImage(e.target.value)}
                      placeholder="https://... またはデータURL"
                      className="w-full px-3.5 py-2 rounded-xl border border-sky-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                    {artCoverImage ? (
                      <div className="relative h-16 rounded-xl overflow-hidden border border-sky-200 shadow-xs bg-slate-100 group">
                        <img src={artCoverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleOpenCropperForSrc(artCoverImage, 'COVER')}
                          className="absolute inset-0 bg-slate-900/60 text-white text-xs font-bold flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition backdrop-blur-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>✂️ クロップ調整</span>
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 rounded-xl border border-sky-100 bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-bold">
                        プレビューなし
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">公開ステータス</label>
                  <select
                    value={artIsPublished}
                    onChange={(e) => setArtIsPublished(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-sky-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  >
                    <option value={1}>公開する (サイトに表示)</option>
                    <option value={0}>下書き保存 (サイトに非表示)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">記事サマリー (一覧に表示される短い概要)</label>
                  <textarea
                    rows={2}
                    value={artSummary}
                    onChange={(e) => setArtSummary(e.target.value)}
                    placeholder="例: 今セットのダブルアップモードで高勝率を維持するためのおすすめペア構成と解説。"
                    className="w-full px-3.5 py-2 rounded-xl border border-sky-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
              </div>

              {/* Article Body Content Textarea with Toolbar, Tabs & Live Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold text-slate-700">記事本文</label>
                    {/* Mode Tabs */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setArtEditorTab('EDIT')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          artEditorTab === 'EDIT'
                            ? 'bg-white text-sky-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" /> 📝 本文を編集
                      </button>
                      <button
                        type="button"
                        onClick={() => setArtEditorTab('PREVIEW')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          artEditorTab === 'PREVIEW'
                            ? 'bg-white text-sky-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" /> 👁️ 実際の見た目プレビュー
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Auto-shorten inline Base64 images if present */}
                    {artContent.includes('data:image/') && (
                      <button
                        type="button"
                        onClick={handleConvertInlineBase64ToShortTags}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black hover:bg-amber-400 transition shadow-xs flex items-center gap-1 animate-pulse"
                        title="本文中の長いBase64画像コードを短い [画像: 1] に自動変換します"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> 🪄 長い画像コードを一括短縮！
                      </button>
                    )}

                    {/* Inline Board Shortcode Tag Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const tag = `\n[board: ${activeBoardKey}]\n\n`;
                        handleInsertTagAtCursor(tag);
                        setArtAttachBoard(true);
                        setMessage({ text: `♟️ 文章の中に構成盤面タグ [board: ${activeBoardKey}] を挿入しました！` });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-black hover:bg-emerald-600 transition shadow-xs flex items-center gap-1"
                    >
                      <Grid className="w-3.5 h-3.5" /> ♟️ 盤面 [board: {activeBoardKey}]
                    </button>

                    {/* Image File Selector Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingImageKey(null);
                        contentFileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sky-500 text-white text-[11px] font-black hover:bg-sky-600 transition shadow-xs flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" /> 🖼️ 画像追加
                    </button>
                    <input
                      type="file"
                      ref={contentFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleOpenCropperForFile(e.target.files[0], 'CONTENT');
                          e.target.value = '';
                        }
                      }}
                    />

                    {/* Champion Badge Button */}
                    <button
                      type="button"
                      onClick={() => setChampPickerOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-black hover:bg-indigo-700 transition shadow-xs flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5" /> 👤 チャンピオン挿入
                    </button>

                    {/* Item Badge Button */}
                    <button
                      type="button"
                      onClick={() => setItemPickerOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-black hover:bg-amber-700 transition shadow-xs flex items-center gap-1"
                    >
                      <Shield className="w-3.5 h-3.5" /> 🗡️ アイテム挿入
                    </button>

                    {/* YouTube Embed Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('挿入するYouTube動画URLを入力してください (例: https://www.youtube.com/watch?v=xxxxx):');
                        if (url) setArtContent(prev => prev + (prev.endsWith('\n') ? '' : '\n') + `\n${url.trim()}\n\n`);
                      }}
                      className="px-2 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold hover:bg-red-100 transition flex items-center gap-1"
                    >
                      <Video className="w-3 h-3" /> YouTube動画
                    </button>

                    {/* Heading H2 Button */}
                    <button
                      type="button"
                      onClick={() => setArtContent(prev => prev + (prev.endsWith('\n') ? '' : '\n') + '\n## 見出しタイトル\n\n')}
                      className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold hover:bg-slate-200 transition"
                    >
                      + 見出し(H2)
                    </button>
                  </div>
                </div>

                {artEditorTab === 'EDIT' ? (
                  <div className="space-y-3">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingContent(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingContent(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingContent(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleOpenCropperForFile(e.dataTransfer.files[0], 'CONTENT');
                        }
                      }}
                      className={`relative rounded-xl transition ${isDraggingContent ? 'ring-2 ring-sky-500 bg-sky-50' : ''}`}
                    >
                      <textarea
                        ref={artContentTextareaRef}
                        rows={14}
                        value={artContent}
                        onChange={(e) => setArtContent(e.target.value)}
                        placeholder="本文を入力... (「👤 チャンピオン挿入」「🗡️ アイテム挿入」で [c:名前] などのリッチバッジを簡単配置できます。実際の見栄えは右上の「👁️ プレビュー」で確認可能)"
                        className="w-full px-4 py-3 rounded-xl border border-sky-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 leading-relaxed font-mono"
                      />
                      {isDraggingContent && (
                        <div className="absolute inset-0 bg-sky-500/15 backdrop-blur-xs rounded-xl border-2 border-dashed border-sky-500 flex items-center justify-center text-sky-800 font-extrabold text-sm pointer-events-none">
                          ここに画像ファイルをドロップして挿入 📥
                        </div>
                      )}
                    </div>

                    {/* Image Palette Cards (Thumbnails & Tags) */}
                    {Object.keys(artImages).length > 0 && (
                      <div className="p-3 bg-slate-50/90 border border-sky-100 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                            <span>本文内の画像一覧 ({Object.keys(artImages).length}枚)</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            本文中の <code className="text-sky-700 bg-sky-100 px-1 py-0.5 rounded font-mono font-bold">[画像: 番号]</code> の位置に画像が表示されます
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
                          {Object.entries(artImages).map(([key, src]) => {
                            const isUsed = artContent.includes(`[画像: ${key}]`) || artContent.includes(`[image: ${key}]`) || artContent.includes(`[img: ${key}]`);
                            return (
                              <div key={key} className="bg-white rounded-xl border border-sky-200 p-2 space-y-1.5 shadow-xs relative group">
                                <div className="relative h-24 rounded-lg overflow-hidden bg-slate-100">
                                  <img src={src} alt={`画像 ${key}`} className="w-full h-full object-cover" />
                                  <span className="absolute top-1 left-1 bg-slate-900/85 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                    [画像: {key}]
                                  </span>
                                  {!isUsed && (
                                    <span className="absolute bottom-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                      本文未配置
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isUsed) {
                                        setArtContent(prev => prev + (prev.endsWith('\n') ? '' : '\n') + `\n[画像: ${key}]\n\n`);
                                        setMessage({ text: `本文に [画像: ${key}] を挿入しました！` });
                                      } else {
                                        setMessage({ text: `[画像: ${key}] はすでに本文内に記述されています` });
                                      }
                                    }}
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition ${
                                      isUsed
                                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                                    }`}
                                  >
                                    {isUsed ? '配置済み' : '+ 本文に挿入'}
                                  </button>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCropperForSrc(src, 'CONTENT', key)}
                                      className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                      title="切り取り・トリミングを再調整"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`[画像: ${key}] を削除しますか？`)) {
                                          setArtImages(prev => {
                                            const copy = { ...prev };
                                            delete copy[key];
                                            return copy;
                                          });
                                          setArtContent(prev => prev.replaceAll(`[画像: ${key}]`, '').replaceAll(`[image: ${key}]`, '').replaceAll(`[img: ${key}]`, ''));
                                        }
                                      }}
                                      className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition"
                                      title="画像を削除"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Boards Palette Cards (Thumbnails & Tags) */}
                    {artAttachBoard && Object.keys(artBoards).length > 0 && (
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                            <Grid className="w-3.5 h-3.5 text-emerald-600" />
                            <span>本文内の構成盤面一覧 ({Object.keys(artBoards).length}個)</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            本文中の <code className="text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">[board: 番号]</code> の位置に盤面が表示されます
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                          {Object.entries(artBoards).map(([bKey, bData]) => {
                            const isUsed = artContent.includes(`[board: ${bKey}]`) || artContent.includes(`[盤面: ${bKey}]`) || (bKey === '1' && (artContent.includes('[board]') || artContent.includes('[tft-board]')));
                            const isActive = activeBoardKey === bKey;
                            const unitCount = (bData.units || []).length;
                            return (
                              <div
                                key={bKey}
                                className={`rounded-xl border p-2.5 space-y-1.5 transition ${
                                  isActive
                                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'bg-white border-emerald-200 hover:border-emerald-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="bg-slate-900 text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded font-mono">
                                      [board: {bKey}]
                                    </span>
                                    <span className="text-xs font-bold text-slate-900 truncate">
                                      {bData.display_name || `構成盤面 ${bKey}`}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-extrabold text-slate-600 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {unitCount}体
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!isUsed) {
                                          handleInsertTagAtCursor(`\n[board: ${bKey}]\n\n`);
                                          setMessage({ text: `本文に [board: ${bKey}] を挿入しました！` });
                                        } else {
                                          setMessage({ text: `[board: ${bKey}] はすでに本文内に記述されています` });
                                        }
                                      }}
                                      className={`text-[10px] px-2 py-0.5 rounded font-bold transition ${
                                        isUsed
                                          ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-black'
                                      }`}
                                    >
                                      {isUsed ? '配置済み' : '+ 本文に挿入'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSwitchActiveBoard(bKey)}
                                      className={`text-[10px] px-2 py-0.5 rounded font-bold transition ${
                                        isActive ? 'bg-sky-500 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      {isActive ? '編集中' : '編集する'}
                                    </button>
                                  </div>

                                  {Object.keys(artBoards).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBoard(bKey)}
                                      className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition"
                                      title="この盤面を削除"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 font-medium">
                      💡 <strong>ヒント:</strong> 構成盤面は <code className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">[board: 1]</code> や <code className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">[board: 2]</code> のように本文中の好きな位置に何個でも配置できます（上部「♟️ 盤面」ボタンからも挿入可能）。画像は <code className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-mono font-bold">[画像: 1]</code> で管理されます。右上の<strong>「👁️ プレビュー」</strong>で実際の見た目を確認できます。
                    </p>
                  </div>
                ) : (
                  /* Live Article Preview */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-sky-900 bg-sky-50 px-3 py-2 rounded-xl border border-sky-200">
                      <span>👁️ 記事プレビュー (ユーザーに表示される実際のデザイン)</span>
                      <button
                        type="button"
                        onClick={() => setArtEditorTab('EDIT')}
                        className="text-[11px] font-bold text-sky-700 hover:underline"
                      >
                        ← 編集に戻る
                      </button>
                    </div>

                    <ArticleContentPreview
                      content={artContent}
                      images={artImages}
                      boardUnits={artAttachBoard ? artBoardUnits : []}
                      boardDisplayName={artBoardDisplayName || artTitle}
                      boards={artAttachBoard ? artBoards : {}}
                    />
                  </div>
                )}
              </div>

              {/* TFT Board Attachment Section */}
              <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={artAttachBoard}
                      onChange={(e) => setArtAttachBoard(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-400"
                    />
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                      <Grid className="w-4 h-4 text-sky-600" /> 記事にTFTチーム構成盤面を埋め込む
                    </span>
                  </label>
                  {artAttachBoard && (
                    <span className="text-[11px] font-bold text-sky-700">
                      配置ユニット: {artBoardUnits.length}体
                    </span>
                  )}
                </div>

                {artAttachBoard && (
                  <div className="space-y-4 pt-2 border-t border-sky-200/80">
                    
                    {/* Multi-board switcher tabs */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-sky-200 pb-2.5">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-1">
                        {Object.entries(artBoards).map(([bKey, bData]) => {
                          const isActive = activeBoardKey === bKey;
                          return (
                            <button
                              key={bKey}
                              type="button"
                              onClick={() => handleSwitchActiveBoard(bKey)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 ${
                                isActive
                                  ? 'bg-sky-600 text-white shadow-md'
                                  : 'bg-white border border-sky-200 text-slate-700 hover:bg-sky-50'
                              }`}
                            >
                              <span>♟️ {bData.display_name || `盤面 ${bKey}`}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-sky-800 text-sky-200' : 'bg-sky-100 text-sky-700'}`}>
                                {(bData.units || []).length}体
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleAddNewBoard}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black hover:opacity-90 transition shadow-xs flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> ＋ 盤面を追加
                        </button>
                        {Object.keys(artBoards).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteBoard(activeBoardKey)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition flex items-center gap-1 border border-red-200"
                            title="選択中の盤面を削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> 削除
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">盤面の構成表示名</label>
                        <input
                          type="text"
                          value={artBoardDisplayName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setArtBoardDisplayName(val);
                            setArtBoards(prev => ({
                              ...prev,
                              [activeBoardKey]: {
                                ...(prev[activeBoardKey] || {}),
                                id: activeBoardKey,
                                display_name: val,
                                units: artBoardUnits
                              }
                            }));
                          }}
                          placeholder="例: 序盤進行 (Lv5), 最終形 (Lv8)"
                          className="w-full px-3 py-1.5 rounded-lg border border-sky-200 bg-white text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">メインキャリー</label>
                        <select
                          value={artMainCarryId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setArtMainCarryId(val);
                            setArtBoards(prev => ({
                              ...prev,
                              [activeBoardKey]: {
                                ...(prev[activeBoardKey] || {}),
                                id: activeBoardKey,
                                main_carry: val ? { id: val, name: val, cost: 4 } : undefined,
                                units: artBoardUnits
                              }
                            }));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-sky-200 bg-white text-xs font-bold text-slate-900"
                        >
                          <option value="">キャリーを選択</option>
                          {champions.map(c => (
                            <option key={c.id} value={c.id}>★{c.cost} {c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            handleInsertTagAtCursor(`\n[board: ${activeBoardKey}]\n\n`);
                            setMessage({ text: `本文に [board: ${activeBoardKey}] を挿入しました！` });
                          }}
                          className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Grid className="w-3.5 h-3.5" />
                          <span>本文に [board: {activeBoardKey}] を挿入</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive 4x7 Hex Board Grid Editor for Article */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 block">4x7 ヘックス盤面配置エディタ (クリックして駒配置)</span>
                      
                      <div className="p-4 bg-sky-100/60 rounded-xl border border-sky-200 overflow-x-auto select-none flex flex-col items-center justify-center">
                        <div className="flex flex-col items-start min-w-[560px]">
                          {[0, 1, 2, 3].map((rowIdx) => {
                            const isOffset = rowIdx % 2 === 1;
                            const marginTopClass = rowIdx > 0 ? '-mt-[18px]' : '';
                            return (
                              <div
                                key={rowIdx}
                                className={`flex items-center gap-[4px] ${marginTopClass} ${
                                  isOffset ? 'pl-[40px]' : ''
                                }`}
                              >
                                {[0, 1, 2, 3, 4, 5, 6].map((colIdx) => {
                                  const unit = artBoardUnits.find(u => u.row === rowIdx && u.col === colIdx);
                                  const displayCost = resolveUnitCost(unit);
                                  return (
                                    <button
                                      key={colIdx}
                                      type="button"
                                      onClick={() => handleOpenCellEditor(rowIdx, colIdx, 'ARTICLE')}
                                      className="relative w-[76px] h-[88px] shrink-0 group transition-transform duration-200 hover:scale-105 hover:z-30 cursor-pointer"
                                      title={unit ? `${unit.name} (クリックで編集)` : 'クリックでユニット追加'}
                                    >
                                      {/* Outer Hexagon Container */}
                                      <div
                                        style={unit ? getCostBorderStyle(displayCost) : undefined}
                                        className={`w-full h-full p-[3.5px] transition-all duration-200 ${hexClipPath} ${
                                          unit ? '' : 'bg-sky-200/80 hover:bg-sky-400/90'
                                        }`}
                                      >
                                        {/* Inner Hexagon Container */}
                                        <div
                                          className={`w-full h-full relative overflow-hidden flex flex-col items-center justify-center ${hexClipPath} ${
                                            unit ? 'bg-slate-900' : 'bg-white hover:bg-sky-50'
                                          }`}
                                        >
                                          {unit ? (() => {
                                            const champIcon = unit.icon || getChampionIcon(unit.id || unit.name) || getChampion(unit.id || unit.name)?.icon;
                                            const champName = unit.name || getChampionName(unit.id) || unit.id;
                                            return (
                                              <>
                                                {/* Star Badges */}
                                                {renderStars(unit.star || 1, displayCost)}

                                                {/* Champion Portrait */}
                                                {champIcon ? (
                                                  <img
                                                    src={champIcon}
                                                    alt={champName}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 pointer-events-none"
                                                    onError={(e) => {
                                                      (e.target as HTMLImageElement).src = getChampionIcon(champName);
                                                    }}
                                                  />
                                                ) : (
                                                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 pointer-events-none">
                                                    {champName}
                                                  </div>
                                                )}

                                                {/* Dark Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent pointer-events-none" />

                                                {/* Champion Name */}
                                                <span className="absolute top-[52%] -translate-y-1/2 inset-x-0 px-0.5 text-[11px] font-black text-white text-center leading-tight tracking-tight truncate drop-shadow-[0_1.5px_3px_rgba(0,0,0,1)] z-10 pointer-events-none">
                                                  {champName}
                                                </span>
                                              </>
                                            );
                                          })() : (
                                            <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none text-sky-500 hover:text-sky-600">
                                              <Plus className="w-4 h-4 text-sky-400" />
                                              <span className="text-[9px] font-mono opacity-60">({rowIdx + 1}-{colIdx + 1})</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Equipped Item Icons */}
                                      {unit && unit.items && unit.items.length > 0 && (
                                        <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-0.5 pointer-events-none">
                                          {unit.items.slice(0, 3).map((item: any, iIdx: number) => {
                                            const itemKey = typeof item === 'string' ? item : (item.id || item.name);
                                            const itemIconSrc = (typeof item === 'object' && item.icon) ? item.icon : getItemIcon(itemKey);
                                            const itemName = (typeof item === 'object' && item.name) ? item.name : itemKey;
                                            return itemIconSrc ? (
                                              <div
                                                key={iIdx}
                                                className="w-[20px] h-[20px] rounded-[3px] border border-slate-950 shadow-lg overflow-hidden bg-slate-950 shrink-0 ring-1 ring-black/60"
                                              >
                                                <img
                                                  src={itemIconSrc}
                                                  alt={itemName}
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                            ) : null;
                                          })}
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}
      </div>

      {/* Cell Unit Placement Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-white border border-sky-200/90 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Grid className="w-4 h-4 text-sky-600" />
                配置編集: [{editingCell.row + 1}行-{editingCell.col + 1}列] (Tab: {currentLvlTab})
              </h3>
              <button
                onClick={() => setEditingCell(null)}
                className="p-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Champion Picker by Cost Tabs & Color Badges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">チャンピオン選択 (コスト順 & あいうえお順)</label>
                
                {/* Cost Filter Tabs */}
                <div className="flex items-center gap-1 bg-sky-50 p-1 rounded-xl border border-sky-200 text-[10px] font-bold">
                  {(['ALL', 1, 2, 3, 4, 5] as const).map((costVal) => (
                    <button
                      key={costVal}
                      type="button"
                      onClick={() => setCostFilter(costVal)}
                      className={`px-2 py-0.5 rounded-lg transition ${
                        costFilter === costVal
                          ? 'bg-sky-500 text-white font-black shadow-sm'
                          : 'text-slate-600 hover:text-sky-600'
                      }`}
                    >
                      {costVal === 'ALL' ? '全コスト' : `${costVal}コスト`}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={cellSearchQuery}
                onChange={(e) => setCellSearchQuery(e.target.value)}
                placeholder="名前で検索..."
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-sky-200 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
              />

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto p-1.5 bg-sky-50/50 rounded-xl border border-sky-200">
                {champions
                  .filter(c => (costFilter === 'ALL' || c.cost === costFilter) && (!cellSearchQuery || c.name.toLowerCase().includes(cellSearchQuery.toLowerCase())))
                  .map((c) => {
                    const isSelected = selectedChampForCell === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedChampForCell(c.id)}
                        className={`p-1.5 rounded-xl border text-left transition flex items-center gap-2 ${getCostStyle(c.cost, isSelected)}`}
                      >
                        {c.icon && <img src={c.icon} alt={c.name} className="w-7 h-7 rounded-lg object-cover shrink-0 border border-sky-200" />}
                        <div className="truncate">
                          <div className="text-[10px] font-extrabold truncate">{c.name}</div>
                          <span className="text-[9px] font-bold opacity-80">{c.cost}G</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Star Level Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ユニットの重なり (★数)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedStarForCell(star)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-black transition ${
                      selectedStarForCell === star
                        ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-sm'
                        : 'border-sky-200 bg-white text-slate-600 hover:bg-sky-50'
                    }`}
                  >
                    ★{star}
                  </button>
                ))}
              </div>
            </div>

            {/* Items Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">装備アイテム選択 (同種重複可能・最大3つ)</label>
                <span className="text-[10px] font-bold text-sky-700">{selectedItemsForCell.length} / 3 個装着中</span>
              </div>

              {/* Equipped Items Bar */}
              <div className="p-2 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between gap-2 min-h-[42px]">
                <div className="flex items-center gap-1.5 flex-1 flex-wrap min-w-0">
                  {selectedItemsForCell.length === 0 ? (
                    <span className="text-[11px] text-slate-400 font-medium italic">アイテム未選択 (下のリストから選択)</span>
                  ) : (
                    selectedItemsForCell.map((itemId, idx) => {
                      const itemObj = items.find(i => i.id === itemId || i.name === itemId) || { name: itemId, icon: getItemIcon(itemId) };
                      return (
                        <div key={`${itemId}-${idx}`} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-sky-300 text-xs font-bold shadow-sm">
                          {itemObj.icon && <img src={itemObj.icon} alt={itemObj.name} className="w-4 h-4 rounded object-cover" />}
                          <span className="text-[10px] text-slate-800 font-bold truncate max-w-[90px]">{itemObj.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...selectedItemsForCell];
                              next.splice(idx, 1);
                              setSelectedItemsForCell(next);
                            }}
                            title="このアイテムを解除"
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 w-4 h-4 rounded flex items-center justify-center font-black transition text-xs"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedItemsForCell.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedItemsForCell([])}
                    className="px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-[10px] font-bold shrink-0 transition"
                  >
                    すべて解除
                  </button>
                )}
              </div>

              <input
                type="text"
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                placeholder="アイテム名で検索 (例: インフィニティ, ワーモグ, ショウジン)..."
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-sky-200 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
              />

              <div className="grid grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto p-1 bg-sky-50/50 rounded-xl border border-sky-200">
                {items
                  .filter(i => {
                    if (!itemSearchQuery.trim()) return true;
                    const q = itemSearchQuery.toLowerCase().replace(/\s+/g, '');
                    const name = (i.name || '').toLowerCase().replace(/\s+/g, '');
                    return name.includes(q);
                  })
                  .map((i) => {
                    const count = selectedItemsForCell.filter(id => id === i.id).length;
                    const isMax = selectedItemsForCell.length >= 3;

                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => {
                          if (selectedItemsForCell.length < 3) {
                            setSelectedItemsForCell([...selectedItemsForCell, i.id]);
                          }
                        }}
                        disabled={isMax}
                        className={`p-1.5 rounded-lg border text-left transition flex items-center justify-between gap-1.5 ${
                          count > 0
                            ? 'border-sky-500 bg-sky-100/90 text-sky-900 font-bold shadow-sm hover:bg-sky-200/80'
                            : isMax
                            ? 'border-sky-100 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
                            : 'border-sky-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {i.icon && <img src={i.icon} alt={i.name} className="w-5 h-5 rounded object-cover shrink-0" />}
                          <span className="text-[9px] truncate">{i.name}</span>
                        </div>

                        {count > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-sky-600 text-white text-[9px] font-black shrink-0 shadow-sm">
                            x{count}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-sky-100">
              <button
                type="button"
                onClick={handleRemoveCellUnit}
                className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition"
              >
                マスから削除
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-700 text-xs font-bold transition"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSaveCellUnit}
                  className="px-4 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-black hover:bg-sky-600 transition shadow-sm"
                >
                  決定
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Image Cropper & Scaler Modal */}
      {cropperOpen && cropperImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn select-none">
          <div className="w-full max-w-2xl bg-white border border-sky-200 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-sky-100 pb-3 shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  画像の拡大・縮小・位置調整・切り取り
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  画像をドラッグして位置移動、ホイールまたはスライダーで拡大縮小して切り取り調整できます。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCropperOpen(false)}
                className="p-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewport / Canvas Container */}
            <div className="relative flex-1 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner min-h-[300px]">
              {/* Cropper Viewport Box */}
              <div
                onMouseDown={(e) => {
                  setIsPanning(true);
                  setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                }}
                onMouseMove={(e) => {
                  if (isPanning) {
                    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
                  }
                }}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY < 0 ? 0.08 : -0.08;
                  setZoom(prev => Math.min(Math.max(0.4, prev + delta), 3.0));
                }}
                className={`relative overflow-hidden cursor-grab active:cursor-grabbing border-2 border-dashed border-sky-400/90 shadow-2xl transition-all ${
                  cropperAspect === '16:9'
                    ? 'w-full aspect-[16/9] max-h-[320px]'
                    : cropperAspect === '4:3'
                    ? 'w-[400px] aspect-[4/3] max-h-[300px]'
                    : cropperAspect === '1:1'
                    ? 'w-[280px] aspect-square'
                    : 'w-full max-h-[320px] aspect-[16/9]'
                }`}
              >
                {/* 3x3 Grid Overlay */}
                <div className="absolute inset-0 z-20 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
                  <div className="border-r border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-b border-white"></div>
                  <div className="border-r border-white"></div>
                  <div className="border-r border-white"></div>
                  <div></div>
                </div>

                {/* Scaled & Rotated Image */}
                <div className="w-full h-full flex items-center justify-center pointer-events-none">
                  <img
                    src={cropperImageSrc}
                    alt="Cropper Target"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                      transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                    }}
                    className="max-w-full max-h-full object-contain pointer-events-none select-none"
                  />
                </div>
              </div>

              <div className="absolute bottom-2 left-3 z-30 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-[10px] font-mono font-bold text-sky-300 pointer-events-none border border-slate-700">
                拡大率: {Math.round(zoom * 100)}% | 角度: {rotation}° | 位置: ({Math.round(pan.x)}, {Math.round(pan.y)})
              </div>
            </div>

            {/* Controls Bar */}
            <div className="space-y-3 bg-sky-50/60 p-3.5 rounded-2xl border border-sky-200/80 shrink-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Aspect Ratio Buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700 mr-1">比率:</span>
                  {[
                    { key: '16:9', label: '16:9 (標準)' },
                    { key: '4:3', label: '4:3' },
                    { key: '1:1', label: '1:1 正方形' },
                    { key: 'FREE', label: '自由' }
                  ].map((ratio) => (
                    <button
                      key={ratio.key}
                      type="button"
                      onClick={() => setCropperAspect(ratio.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        cropperAspect === ratio.key
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white border border-sky-200 text-slate-700 hover:bg-sky-100'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>

                {/* Rotation & Reset Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-slate-700 hover:bg-sky-100 text-xs font-bold transition flex items-center gap-1"
                  >
                    🔄 90°回転
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1.0);
                      setPan({ x: 0, y: 0 });
                      setRotation(0);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-slate-600 hover:bg-sky-100 text-xs font-bold transition"
                  >
                    リセット
                  </button>
                </div>
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 w-16 shrink-0">🔍 ズーム:</span>
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                  className="w-7 h-7 rounded-lg bg-white border border-sky-200 text-slate-700 font-bold hover:bg-sky-100 flex items-center justify-center text-sm"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.4"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-sky-600 cursor-pointer h-2 bg-sky-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.min(3.0, prev + 0.1))}
                  className="w-7 h-7 rounded-lg bg-white border border-sky-200 text-slate-700 font-bold hover:bg-sky-100 flex items-center justify-center text-sm"
                >
                  +
                </button>
                <span className="text-xs font-mono font-bold text-sky-700 w-12 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-sky-100 shrink-0">
              <button
                type="button"
                onClick={() => setCropperOpen(false)}
                className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-slate-700 text-xs font-bold transition border border-sky-200"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs font-black shadow-md transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>✂️ 切り取りを適用して挿入</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Champion Picker Modal for Article Content */}
      {champPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-indigo-200 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>本文に挿入するチャンピオンを選択</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  選択したチャンピオンが <code className="bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-mono font-bold">[c:名前]</code> タグとしてカーソル位置に挿入されます
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChampPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['ALL', 1, 2, 3, 4, 5, 6] as const).map((costVal) => (
                  <button
                    key={costVal}
                    type="button"
                    onClick={() => setChampPickerCost(costVal)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                      champPickerCost === costVal
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {costVal === 'ALL' ? '全員' : `${costVal}コスト`}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={champPickerSearch}
                  onChange={(e) => setChampPickerSearch(e.target.value)}
                  placeholder="チャンピオン名で検索 (例: アーリ, コグマウ)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Champions Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pr-1">
              {champions
                .filter((c) => (champPickerCost === 'ALL' || c.cost === champPickerCost) && (!champPickerSearch || c.name.toLowerCase().includes(champPickerSearch.toLowerCase())))
                .map((c) => {
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        handleInsertTagAtCursor(`[c:${c.name}]`);
                        setChampPickerOpen(false);
                        setMessage({ text: `👤 チャンピオン「${c.name}」を本文に挿入しました！` });
                      }}
                      className="p-2 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition flex items-center gap-2 group"
                    >
                      {c.icon ? (
                        <img src={c.icon} alt={c.name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0 flex items-center justify-center text-xs">👤</div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{c.name}</div>
                        <span className="text-[10px] font-bold text-slate-500">{c.cost}コスト</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Item Picker Modal for Article Content */}
      {itemPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-amber-200 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>本文に挿入するアイテムを選択</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  選択したアイテムが <code className="bg-amber-50 text-amber-700 px-1 py-0.5 rounded font-mono font-bold">[i:名前]</code> タグとしてカーソル位置に挿入されます
                </p>
              </div>
              <button
                type="button"
                onClick={() => setItemPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={itemPickerSearch}
                onChange={(e) => setItemPickerSearch(e.target.value)}
                placeholder="アイテム名で検索 (例: インフィニティ, レイジブレード)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pr-1">
              {items
                .map((i) => {
                  const resolvedName = getItemName(i.name || i.id) || i.name || i.id;
                  const resolvedIcon = getItemIcon(i.id || i.name) || i.icon;
                  return { ...i, displayName: resolvedName, displayIcon: resolvedIcon };
                })
                .filter((i) => !itemPickerSearch || i.displayName.toLowerCase().includes(itemPickerSearch.toLowerCase()))
                .map((i) => {
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => {
                        handleInsertTagAtCursor(`[i:${i.displayName}]`);
                        setItemPickerOpen(false);
                        setMessage({ text: `🗡️ アイテム「${i.displayName}」を本文に挿入しました！` });
                      }}
                      className="p-2 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition flex items-center gap-2 group"
                    >
                      {i.displayIcon ? (
                        <img src={i.displayIcon} alt={i.displayName} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0 flex items-center justify-center text-xs">🗡️</div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-900 truncate group-hover:text-amber-600 transition-colors">{i.displayName}</div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
