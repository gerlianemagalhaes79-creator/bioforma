import { db, doc, setDoc } from '../firebase';
import { extractEditalLeafNodes, generateStudySchedule, INITIAL_EDITAL_TOPICS, EditalLeafNode } from '../data/seducData';
import { TopicStatus } from '../types';

/**
 * Sincroniza as marcações do Cronograma de Estudos para o Edital Verticalizado.
 * Quando um assunto/subtópico é concluído no cronograma, marca automaticamente no Edital.
 */
export function syncCronogramaToEdital(
  updatedCompletedIds: Record<string, boolean>,
  userDegree?: string,
  activeUid?: string
) {
  const degree = userDegree || 'Licenciatura em Língua Portuguesa / Letras';
  const uid = activeUid || 'guest';
  const editalStorageKey = `studyProgress_${uid}`;

  const leafNodes = extractEditalLeafNodes(degree);
  const scheduleDays = generateStudySchedule({ degree }, INITIAL_EDITAL_TOPICS);

  const leafMapByName = new Map<string, EditalLeafNode[]>();
  leafNodes.forEach(node => {
    const key = node.leafName.trim().toLowerCase();
    const existing = leafMapByName.get(key) || [];
    existing.push(node);
    leafMapByName.set(key, existing);
  });

  // Mapeia cada ID de folha do Edital para todos os subKeys do Cronograma que se referem a ela
  const leafToSubKeysMap = new Map<string, Set<string>>();

  scheduleDays.forEach(day => {
    day.topics.forEach(session => {
      session.subtopicNames.forEach((subName, subIdx) => {
        const subKey = `${session.id}_sub_${subIdx}`;
        const directLeafId = session.leafIds?.[subIdx];

        const targetIds = new Set<string>();
        if (directLeafId) {
          targetIds.add(directLeafId);
        } else {
          const exactMatches = leafMapByName.get(subName.trim().toLowerCase());
          const matches = exactMatches || leafNodes.filter(l => l.leafName.toLowerCase().includes(subName.toLowerCase()));
          matches.forEach(m => targetIds.add(m.id));
        }

        targetIds.forEach(leafId => {
          if (!leafToSubKeysMap.has(leafId)) {
            leafToSubKeysMap.set(leafId, new Set());
          }
          leafToSubKeysMap.get(leafId)!.add(subKey);
        });
      });
    });
  });

  let editalProgress: Record<string, TopicStatus> = {};
  try {
    const local = localStorage.getItem(editalStorageKey) || localStorage.getItem('studyProgress_guest');
    if (local) editalProgress = JSON.parse(local);
  } catch (_) {}

  // Atualiza a situação de cada nó do edital com base nas marcações do cronograma
  leafToSubKeysMap.forEach((subKeysSet, leafId) => {
    const subKeys = Array.from(subKeysSet);
    const isCompleted = subKeys.some(k => !!updatedCompletedIds[k]);

    if (isCompleted) {
      editalProgress[leafId] = 'mastered';
      if (uid && uid !== 'guest') {
        const userProgressRef = doc(db, 'studyProgress', `${uid}_${leafId}`);
        setDoc(userProgressRef, {
          uid: uid,
          itemId: leafId,
          status: 'mastered',
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }
    } else {
      if (editalProgress[leafId] === 'mastered') {
        editalProgress[leafId] = 'not_started';
        if (uid && uid !== 'guest') {
          const userProgressRef = doc(db, 'studyProgress', `${uid}_${leafId}`);
          setDoc(userProgressRef, {
            uid: uid,
            itemId: leafId,
            status: 'not_started',
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});
        }
      }
    }
  });

  try {
    localStorage.setItem(editalStorageKey, JSON.stringify(editalProgress));
    localStorage.setItem('studyProgress_guest', JSON.stringify(editalProgress));
  } catch (_) {}

  window.dispatchEvent(new Event('studyProgressUpdated'));
}

/**
 * Sincroniza as marcações do Edital Verticalizado para o Cronograma de Estudos.
 * Quando um tópico/subtópico é grifado/concluído no Edital, marca no Cronograma.
 */
export function syncEditalToCronograma(
  editalProgress: Record<string, TopicStatus>,
  userDegree?: string,
  activeUid?: string
) {
  const degree = userDegree || 'Licenciatura em Língua Portuguesa / Letras';
  const uid = activeUid || 'guest';
  const cronogramaStorageKey = `cronogramaProgress_${uid}`;

  const scheduleDays = generateStudySchedule({ degree }, INITIAL_EDITAL_TOPICS);
  const leafNodes = extractEditalLeafNodes(degree);

  const leafMapByName = new Map<string, EditalLeafNode[]>();
  leafNodes.forEach(node => {
    const key = node.leafName.trim().toLowerCase();
    const existing = leafMapByName.get(key) || [];
    existing.push(node);
    leafMapByName.set(key, existing);
  });

  let completedTopicIds: Record<string, boolean> = {};
  try {
    const saved = localStorage.getItem(cronogramaStorageKey) || localStorage.getItem('cronogramaProgress_guest');
    if (saved) completedTopicIds = JSON.parse(saved);
  } catch (_) {}

  let changed = false;

  scheduleDays.forEach(day => {
    day.topics.forEach(session => {
      session.subtopicNames.forEach((subName, subIdx) => {
        const subKey = `${session.id}_sub_${subIdx}`;
        const directLeafId = session.leafIds?.[subIdx];

        const targetIds = new Set<string>();
        if (directLeafId) {
          targetIds.add(directLeafId);
        } else {
          const exactMatches = leafMapByName.get(subName.trim().toLowerCase());
          const matches = exactMatches || leafNodes.filter(l => l.leafName.toLowerCase().includes(subName.toLowerCase()));
          matches.forEach(m => targetIds.add(m.id));
        }

        targetIds.forEach(leafId => {
          const status = editalProgress[leafId];
          if (status === 'mastered' || status === 'reviewed') {
            if (!completedTopicIds[subKey]) {
              completedTopicIds[subKey] = true;
              changed = true;
            }
          } else if (status === 'not_started') {
            if (completedTopicIds[subKey]) {
              completedTopicIds[subKey] = false;
              changed = true;
            }
          }
        });
      });
    });
  });

  if (changed) {
    try {
      localStorage.setItem(cronogramaStorageKey, JSON.stringify(completedTopicIds));
      localStorage.setItem('cronogramaProgress_guest', JSON.stringify(completedTopicIds));
      localStorage.setItem('cronogramaProgress_default', JSON.stringify(completedTopicIds));
    } catch (_) {}

    if (uid && uid !== 'guest') {
      setDoc(doc(db, 'cronogramaProgress', uid), {
        uid: uid,
        completedTopicIds: completedTopicIds,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});

      const count = Object.values(completedTopicIds).filter(Boolean).length;
      setDoc(doc(db, 'users', uid), {
        completedTopicsCount: count
      }, { merge: true }).catch(() => {});
    }

    window.dispatchEvent(new Event('cronogramaProgressUpdated'));
    window.dispatchEvent(new Event('studyProgressUpdated'));
  }
}
