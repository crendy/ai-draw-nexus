import Dexie, {type EntityTable} from 'dexie';
import type {Group, Project, VersionHistory} from '@/types';

interface Config {
  key: string;
  value: any;
}

const db = new Dexie('AiDrawDatabase') as Dexie & {
  projects: EntityTable<Project, 'id'>;
  groups: EntityTable<Group, 'id'>;
  versions: EntityTable<VersionHistory, 'id'>;
  configs: EntityTable<Config, 'key'>;
};

db.version(1).stores({
  projects: 'id, title, engineType, groupId, createdAt, updatedAt',
  groups: 'id, name, createdAt, updatedAt',
  versions: 'id, projectId, timestamp',
  configs: 'key'
});

export { db };

