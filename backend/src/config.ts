export enum RepositoryType {
  AZDO = 0,
  GITHUB,
  GITLAB,
}

export enum PipelineType {
  AZDO = 0,
  GITHUB_ACTIONS,
  GITLAB,
}

export interface IConfig {
  pipelineConfig:
  | IAzDOPipelineConfig
  | IGithubActionsConfig
  | IGitlabPipelineConfig;
  repoConfig: IAzDORepoConfig | IGithubRepoConfig | IGitlabRepoConfig;
  storageAccessKey: string;
  storageAccountName: string;
  storageTableName: string;
  storagePartitionKey: string;
  dockerVersion?: string;
  repoType: RepositoryType;
  pipelineType: PipelineType;
}

export interface IAzDOPipelineConfig {
  // AzDO pipeline
  org: string;
  project: string;
  accessToken?: string;
}

export interface IAzDORepoConfig {
  accessToken?: string;
  manifestRepo: string;
}

export interface IGithubActionsConfig {
  accessToken?: string;
}

export interface IGithubRepoConfig {
  accessToken?: string;
  sourceRepo: string;
  hldRepo: string;
  manifestRepo: string;
}

export interface IGitlabPipelineConfig {
  accessToken: string;
}

export interface IGitlabRepoConfig {
  accessToken: string;
  sourceRepoProjectId: string;
  hldRepoProjectId: string;
  manifestProjectId: string;
}

export const getPipelineConfig = () => {
  let pipelineConfig:
    | IAzDOPipelineConfig
    | IGithubActionsConfig
    | IGitlabPipelineConfig
    | undefined;
  let pipelineType = 0;
  // azdo pipeline
  if (process.env.REACT_APP_AZDO_ORG && process.env.REACT_APP_AZDO_PROJECT) {
    pipelineConfig = {
      org: process.env.REACT_APP_AZDO_ORG,
      project: process.env.REACT_APP_AZDO_PROJECT,
      accessToken: process.env.REACT_APP_AZDO_ACCESS_TOKEN,
    };
    pipelineType = PipelineType.AZDO;
  } else if (process.env.REACT_APP_GITHUB_TOKEN) {
    // github actions pipeline
    pipelineConfig = {
      accessToken: process.env.REACT_APP_GITHUB_TOKEN,
    };
    pipelineType = PipelineType.GITHUB_ACTIONS;
  } else if (process.env.REACT_APP_GITLAB_TOKEN) {
    // gitlab pipeline
    pipelineConfig = {
      accessToken: process.env.REACT_APP_GITLAB_TOKEN,
    };
    pipelineType = PipelineType.GITLAB;
  }

  return {
    pipelineType,
    pipelineConfig,
  };
};

export const getReposConfig = () => {
  let reposConfig:
    | IAzDORepoConfig
    | IGithubRepoConfig
    | IGitlabRepoConfig
    | undefined;
  let repoType = 0;
  // azdo repos
  if (process.env.REACT_APP_AZDO_MANIFEST_REPO) {
    reposConfig = {
      manifestRepo: process.env.REACT_APP_AZDO_MANIFEST_REPO,
      accessToken: process.env.REACT_APP_AZDO_ACCESS_TOKEN,
    };
    repoType = RepositoryType.AZDO;
  } else if (
    process.env.REACT_APP_GITHUB_MANIFEST_REPO &&
    process.env.REACT_APP_GITHUB_HLD_REPO &&
    process.env.REACT_APP_GITHUB_SOURCE_REPO
  ) {
    // github config
    reposConfig = {
      manifestRepo: process.env.REACT_APP_GITHUB_MANIFEST_REPO,
      hldRepo: process.env.REACT_APP_GITHUB_HLD_REPO,
      sourceRepo: process.env.REACT_APP_GITHUB_SOURCE_REPO,
      accessToken: process.env.REACT_APP_GITHUB_TOKEN,
    };
    repoType = RepositoryType.GITHUB;
  } else if (
    process.env.REACT_APP_GITLAB_SOURCE_PROJECT_ID &&
    process.env.REACT_APP_GITLAB_HLD_PROJECT_ID &&
    process.env.REACT_APP_GITLAB_MANIFEST_PROJECT_ID &&
    process.env.REACT_APP_GITLAB_TOKEN
  ) {
    // gitlab config
    reposConfig = {
      manifestProjectId: process.env.REACT_APP_GITLAB_MANIFEST_PROJECT_ID,
      hldRepoProjectId: process.env.REACT_APP_GITLAB_HLD_PROJECT_ID,
      sourceRepoProjectId: process.env.REACT_APP_GITLAB_SOURCE_PROJECT_ID,
      accessToken: process.env.REACT_APP_GITLAB_TOKEN,
    };
    repoType = RepositoryType.GITLAB;
  }

  return {
    repoType,
    reposConfig,
  };
};

export const getConfig = (): IConfig => {
  const { pipelineType, pipelineConfig } = getPipelineConfig();
  const { repoType, reposConfig } = getReposConfig();
  if (pipelineConfig && reposConfig) {
    return {
      pipelineConfig,
      repoConfig: reposConfig,
      storageAccessKey: process.env.REACT_APP_STORAGE_ACCESS_KEY || "",
      storageAccountName: process.env.REACT_APP_STORAGE_ACCOUNT_NAME || "",
      storagePartitionKey: process.env.REACT_APP_STORAGE_PARTITION_KEY || "",
      storageTableName: process.env.REACT_APP_STORAGE_TABLE_NAME || "",
      repoType,
      pipelineType,
    };
  }

  throw Error("Pipeline and/or repository could not be recognized.");
};

/**
 * Gets cache refresh interval
 */
export const cacheRefreshInterval = (): number => {
  const interval = process.env.REACT_APP_CACHE_REFRESH_INTERVAL_IN_SEC || "30";
  const val = parseInt(interval, 10);
  return isNaN(val) ? 30 * 1000 : val * 1000;
};

export const isAzdo = (): boolean => {
  const config = getConfig();
  return (
    config.pipelineType === PipelineType.AZDO &&
    (config.pipelineConfig as IAzDOPipelineConfig).org !== undefined &&
    (config.pipelineConfig as IAzDOPipelineConfig).project !== undefined &&
    (config.repoConfig as IAzDORepoConfig).manifestRepo !== undefined
  );
};
export const isGithubActions = (): boolean => {
  const config = getConfig();
  return (
    config.pipelineType === PipelineType.GITHUB_ACTIONS &&
    (config.repoConfig as IGithubRepoConfig).sourceRepo !== undefined &&
    (config.repoConfig as IGithubRepoConfig).hldRepo !== undefined &&
    (config.repoConfig as IGithubRepoConfig).manifestRepo !== undefined
  );
};
export const isGitlab = (): boolean => {
  const config = getConfig();
  return (
    config.pipelineType === PipelineType.GITLAB &&
    (config.repoConfig as IGitlabRepoConfig).sourceRepoProjectId !==
    undefined &&
    (config.repoConfig as IGitlabRepoConfig).hldRepoProjectId !== undefined &&
    (config.repoConfig as IGitlabRepoConfig).manifestProjectId !== undefined
  );
};

/**
 * Checks whether config is valid or not
 */
export const isConfigValid = (): boolean => {
  const config = getConfig();
  if (
    (isAzdo() || isGithubActions() || isGitlab()) &&
    !!config.storageAccountName &&
    !!config.storageAccessKey &&
    !!config.storageTableName &&
    !!config.storagePartitionKey
  ) {
    return true;
  }
  return false;
};
