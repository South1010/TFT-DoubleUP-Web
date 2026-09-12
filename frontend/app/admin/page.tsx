'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Plus, Save, Trash2, Grid, Check, Sparkles, AlertCircle, HeartHandshake, Shield, Award, ArrowLeft, X, Search, Zap, Star } from 'lucide-react';
import Link from 'next/link';
import { CompStat, UnitDetail, Item, getTierStyle } from '@/utils/compTypes';
import { calculateAllTeamTraits } from '@/utils/traitHelpers';
import { getAllChampions, getAllItems, getAllAugments, getAugment, getItemIcon, getAugmentTierStyle } from '@/utils/setMaster';
import ItemIcon from '@/components/ItemIcon';

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

export default function AdminPage() {
  const [passcode, setPasscode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

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
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedChampForCell, setSelectedChampForCell] = useState<string>('');
  const [selectedStarForCell, setSelectedStarForCell] = useState<number>(2);
  const [selectedItemsForCell, setSelectedItemsForCell] = useState<string[]>([]);
  const [cellSearchQuery, setCellSearchQuery] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [costFilter, setCostFilter] = useState<number | 'ALL'>('ALL');

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
        latestComps = sortCompsByTierAndName(compsData);
        setCompsList(latestComps);
      }
      return latestComps;
    } catch (e) {
      console.error('Failed to load master data from API, using local setMaster:', e);
      return [];
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      if (res.ok) {
        setAuthenticated(true);
      } else {
        const err = await res.json();
        setAuthError(err.detail || 'パスコードが正しくありません');
      }
    } catch (e) {
      setAuthError('サーバー接続エラーが発生しました');
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

  // Cell Click -> Open Unit Editor
  const handleOpenCellEditor = (row: number, col: number) => {
    const currentUnits = boardUnitsMap[currentLvlTab] || [];
    const existingUnit = currentUnits.find(u => u.row === row && u.col === col);

    setEditingCell({ row, col });
    if (existingUnit) {
      setSelectedChampForCell(existingUnit.id);
      setSelectedStarForCell(existingUnit.star || 2);
      setSelectedItemsForCell((existingUnit.items || []).map(i => i.id));
    } else {
      setSelectedChampForCell(champions.length > 0 ? champions[0].id : '');
      setSelectedStarForCell(2);
      setSelectedItemsForCell([]);
    }
  };

  // Save Unit to current level board
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

    const currentBoard = [...(boardUnitsMap[currentLvlTab] || [])];
    const filteredBoard = currentBoard.filter(u => !(u.row === row && u.col === col));
    filteredBoard.push(newUnit);

    const updatedMap = {
      ...boardUnitsMap,
      [currentLvlTab]: filteredBoard
    };
    setBoardUnitsMap(updatedMap);

    // Auto update traits summary if editing FINAL board
    if (currentLvlTab === 'FINAL') {
      const { activeTraits } = calculateAllTeamTraits(filteredBoard);
      setTraitsSummary(activeTraits.map(t => `${t.count} ${t.name}`).join(', '));
    }

    setEditingCell(null);
  };

  // Remove Unit from cell
  const handleRemoveCellUnit = () => {
    if (!editingCell) return;
    const { row, col } = editingCell;
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
      let hasOverlap = false;
      for (const key of currentChampKeys) {
        if (key && targetChampKeys.has(key)) {
          hasOverlap = true;
          break;
        }
      }

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
          items: (u.items || []).map(i => i.id)
        }));
      }
    });

    const finalUnitsPayload = (boardUnitsMap['FINAL'] || []).map(u => ({
      id: u.id,
      role: u.role,
      row: u.row,
      col: u.col,
      star: u.star,
      items: (u.items || []).map(i => i.id)
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
        const err = await res.json();
        setMessage({ text: err.detail || '保存に失敗しました', isError: true });
      }
    } catch (e) {
      setMessage({ text: 'サーバー通信エラーが発生しました', isError: true });
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
        setMessage({ text: '削除に失敗しました', isError: true });
      }
    } catch (e) {
      setMessage({ text: '通信エラーが発生しました', isError: true });
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

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Registered Comps List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>登録済み構成一覧</span>
              <span className="text-[10px] text-slate-400">({compsList.length}件)</span>
            </h2>
            <div className="flex items-center gap-1.5">
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
              <div className="min-w-[560px] space-y-2 py-2 overflow-x-auto select-none">
                {[0, 1, 2, 3].map((rowIdx) => {
                  const isOffset = rowIdx % 2 === 1;
                  return (
                    <div
                      key={rowIdx}
                      className={`flex items-center justify-center gap-2 ${
                        isOffset ? 'pl-6' : ''
                      }`}
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((colIdx) => {
                        const unit = currentBoardUnits.find(
                          u => u.row === rowIdx && u.col === colIdx
                        );
                        const isDraggingThis = draggedHex?.row === rowIdx && draggedHex?.col === colIdx;
                        const isHoveredTarget = hoveredHex?.row === rowIdx && hoveredHex?.col === colIdx;

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
                            className={`relative w-16 h-16 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                              isHoveredTarget
                                ? 'border-2 border-emerald-500 bg-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.4)] scale-110 z-20'
                                : isDraggingThis
                                ? 'opacity-30 border-sky-400 border-dashed scale-95'
                                : unit
                                ? 'border-sky-300 bg-white shadow-sm hover:scale-105 hover:border-sky-500'
                                : 'border-sky-200/80 bg-white hover:border-sky-400 hover:bg-sky-100/50 hover:scale-105'
                            }`}
                            title={unit ? `${unit.name} (ドラッグで他のマスへ移動・入れ替え / クリックで編集)` : 'クリックでユニット追加'}
                          >
                            {unit ? (
                              <div className="relative w-full h-full p-1 flex flex-col items-center justify-center text-center pointer-events-none">
                                {unit.icon && (
                                  <img
                                    src={unit.icon}
                                    alt={unit.name}
                                    className="w-10 h-10 rounded-lg object-cover shadow-sm"
                                  />
                                )}
                                <span className="text-[9px] font-bold text-slate-900 truncate w-full mt-0.5 bg-white/95 px-1 rounded shadow-sm">
                                  {unit.name}
                                </span>
                                <span className="absolute -top-1 -left-1 px-1 text-[8px] font-black rounded bg-slate-900 text-amber-300 border border-amber-500/40">
                                  ★{unit.star}
                                </span>
                                {unit.items && unit.items.length > 0 && (
                                  <div className="absolute -bottom-1 flex items-center gap-0.5 bg-white px-1 rounded border border-sky-200 shadow-sm">
                                    {unit.items.map((item, iIdx) => (
                                      <img
                                        key={iIdx}
                                        src={getItemIcon(item.id || item.name) || item.icon}
                                        alt={item.name}
                                        className="w-3 h-3 rounded object-cover"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-sky-400 font-mono pointer-events-none">+ 配置</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
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
                  .filter(i => !itemSearchQuery || i.name.toLowerCase().includes(itemSearchQuery.toLowerCase()))
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

    </main>
  );
}
