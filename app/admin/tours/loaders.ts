import { createAdminApi } from "@/lib/api/admin";
import { isBackendApiError } from "@/lib/api/core/backend-client";

export const loadToursListData = async (accessToken: string) => {
  try {
    const adminApi = createAdminApi(accessToken);
    return {
      tours: await adminApi.getTours(),
    };
  } catch (error) {
    return {
      errorMessage:
        isBackendApiError(error) || error instanceof Error
          ? error.message
          : "Unable to load tours.",
    };
  }
};

export const loadTourEditorData = async ({
  accessToken,
  id,
}: {
  accessToken: string;
  id?: string;
}) => {
  try {
    const adminApi = createAdminApi(accessToken);
    const [tags, languages, tour] = await Promise.all([
      adminApi.getTags(),
      adminApi.getLanguages(),
      id ? adminApi.getTour(id) : Promise.resolve(null),
    ]);

    return {
      languages,
      tags,
      tour,
    };
  } catch (error) {
    return {
      errorMessage:
        isBackendApiError(error) || error instanceof Error
          ? error.message
          : "Unable to load the tour editor.",
    };
  }
};
