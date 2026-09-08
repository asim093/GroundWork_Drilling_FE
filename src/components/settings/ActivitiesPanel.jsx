import { useEffect, useMemo, useState } from 'react';
import { MasterDataPanel } from './MasterDataPanel.jsx';
import {
  activitiesService,
  activityCategoriesService
} from '../../services/masterDataService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

export const ActivitiesPanel = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    activityCategoriesService
      .list({ limit: 100, sort: 'name', order: 'asc' })
      .then((response) => setCategories(response.data))
      .catch((error) =>
        notifyError(extractErrorMessage(error, 'Unable to load activity categories'))
      );
  }, []);

  const options = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories]
  );

  const extraColumn = useMemo(
    () => ({
      label: 'Category',
      kind: 'select',
      required: true,
      payloadKey: 'categoryId',
      filterParam: 'category',
      filterPlaceholder: 'All categories',
      filterOptions: options,
      fieldOptions: options,
      render: (record) => record.categoryId?.name || '—',
      initialValue: (record) => record.categoryId?.id || record.categoryId || ''
    }),
    [options]
  );

  return (
    <MasterDataPanel
      service={activitiesService}
      singular="Activity"
      plural="Activities"
      extraColumn={extraColumn}
    />
  );
};
