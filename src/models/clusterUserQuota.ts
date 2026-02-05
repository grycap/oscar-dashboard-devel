export type ClusterUserQuota = {
    resources: Resources;
};

type Resources = {
    cpu: ResourceDetail;
    memory: ResourceDetail;
};

type ResourceDetail = {
    max: number;
    used: number;
};  