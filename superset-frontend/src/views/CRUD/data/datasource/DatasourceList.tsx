import React, {
  FunctionComponent, useMemo, useState,

} from 'react';
import { t, styled } from '@superset-ui/core';
import withToasts from 'src/components/MessageToasts/withToasts';
import SubMenu, {
  SubMenuProps,
} from 'src/views/components/SubMenu';
import ListView from 'src/components/ListView';
import { commonMenuData } from 'src/views/CRUD/data/common';
import { Tooltip } from 'antd';
import Icons from 'src/components/Icons';
import { DatasourceObject } from './types';
import { useListViewResource } from '../../hooks';
import { addDangerToast } from 'src/components/MessageToasts/actions';
import DeleteModal from 'src/components/DeleteModal';
import DatasourceModal from './DatasourceModal';

const PAGE_SIZE = 25;

interface DatasourceListProps {

}

const Actions = styled.div`
  color: ${({ theme }) => theme.colors.grayscale.base};

  .action-button {
    display: inline-block;
    height: 100%;
  }
`;

const DatasourceList: FunctionComponent<DatasourceListProps> = ({

}) => {
  // const {
  //   state: {
  //     loading,
  //     resourceCount: datasourceCount,
  //     resourceCollection: datasource,
  //   },
  //   hasPerm,
  //   fetchData,
  //   refreshData,
  // } = useListViewResource<DatasourceObject>(
  //   'datasource',
  //   t('datasource'),
  //   addDangerToast,
  // );
  const datasourceCount = 0;
  const datasources: DatasourceObject[] = [];
  const fetchData = () => { }
  const loading = false;

  function handleDatasourceDelete({ id, catalog_name: ctName }: DatasourceObject) {
    // SupersetClient.delete({
    //   endpoint: `/api/v1/database/${id}`,
    // }).then(
    //   () => {
    //     refreshData();
    //     addSuccessToast(t('Deleted: %s', ctName));

    //     // Close delete modal
    //     //  setDatabaseCurrentlyDeleting(null);
    //   },
    //   createErrorHandler(errMsg =>
    //     addDangerToast(t('There was an issue deleting %s: %s', ctName, errMsg)),
    //   ),
    // );
  }
  const [currentDatasource, setCurrentDatasource] = useState<DatasourceObject | null>(
    null,
  );
  const [datasourceModalOpen, setDatasourceModalOpen] = useState<boolean>(false);
  const [datasourceCurrentlyDeleting, setDatasourceCurrentlyDeleting] =
    useState<DatasourceObject | null>(null);
  function handleDatasourceEditModal({
    datasource = null,
    modalOpen = false,
  }: { datasource?: DatasourceObject | null; modalOpen?: boolean } = {}) {
    setCurrentDatasource(datasource);
    setDatasourceModalOpen(modalOpen);
  }

  const menuData: SubMenuProps = {
    activeChild: 'Data source',
    ...commonMenuData,
  };

  menuData.buttons = [
    {
      'data-test': 'btn-create-datasource',
      name: (
        <>
          <i className="fa fa-plus" /> {t('Datasource')}{' '}
        </>
      ),
      buttonStyle: 'primary',
      onClick: () => {
        // Ensure modal will be opened in add mode
        handleDatasourceEditModal({ modalOpen: true });
      },
    },
  ];

  const openDatasourceDeleteModal = (datasource: DatasourceObject) => { };
  // SupersetClient.get({
  //   endpoint: `/api/v1/database/${datasource.catalog_name}/related_objects/`,
  // })
  //   .then(({ json = {} }) => {
  //     setDatasourceCurrentlyDeleting({
  //       ...datasource,
  //     });
  //   })
  //   .catch(
  //     createErrorHandler(errMsg =>
  //       t(
  //         'An error occurred while fetching database related data: %s',
  //         errMsg,
  //       ),
  //     ),
  //   );


  const columns = useMemo(
    () => [
      {
        accessor: 'catalog_name',
        Header: t('Catalog Name'),
      },
      {
        accessor: 'connector_type',
        Header: t('Connector Type'),
        size: 'lg',
      },
      {
        accessor: 'created_by',
        disableSortBy: true,
        Header: t('Created by'),
        Cell: ({
          row: {
            original: { created_by: createdBy },
          },
        }: any) =>
          createdBy ? `${createdBy.first_name} ${createdBy.last_name}` : '',
        size: 'xl',
      },
      {
        Cell: ({
          row: {
            original: { changed_on_delta_humanized: changedOn },
          },
        }: any) => changedOn,
        Header: t('Last modified'),
        accessor: 'changed_on_delta_humanized',
        size: 'xl',
      },
      {
        Cell: ({ row: { original } }: any) => {
          const handleEdit = () =>
            handleDatasourceEditModal({ datasource: original, modalOpen: true });
          const handleDelete = () => openDatasourceDeleteModal(original);
          return (
            <Actions className="actions">
              {(
                <span
                  role="button"
                  tabIndex={0}
                  className="action-button"
                  data-test="database-delete"
                  onClick={handleDelete}
                >
                  <Tooltip
                    id="delete-action-tooltip"
                    title={t('Delete database')}
                    placement="bottom"
                  >
                    <Icons.Trash />
                  </Tooltip>
                </span>
              )}
              {(
                <Tooltip
                  id="edit-action-tooltip"
                  title={t('Edit')}
                  placement="bottom"
                >
                  <span
                    role="button"
                    data-test="database-edit"
                    tabIndex={0}
                    className="action-button"
                    onClick={handleEdit}
                  >
                    <Icons.EditAlt data-test="edit-alt" />
                  </span>
                </Tooltip>
              )}
            </Actions>
          );
        },
        Header: t('Actions'),
        id: 'actions',
        disableSortBy: true,
      },
    ],
    []
  );

  return (
    <>
      <SubMenu {...menuData} />
      <DatasourceModal
        databaseId={currentDatasource?.id}
        show={datasourceModalOpen}
        onHide={handleDatasourceEditModal}
        onDatabaseAdd={() => {
          refreshData();
        }}
      />
      {datasourceCurrentlyDeleting && (
        <DeleteModal
          description={t(
            'deleting...'
          )}
          onConfirm={() => {
            if (datasourceCurrentlyDeleting) {
              handleDatasourceDelete(datasourceCurrentlyDeleting);
            }
          }}
          onHide={() => setDatasourceCurrentlyDeleting(null)}
          open
          title={t('Delete Database?')}
        />
      )}
      <ListView<DatasourceObject>
        className="datasource-list-view"
        columns={columns}
        count={datasourceCount}
        data={datasources}
        fetchData={fetchData}
        loading={loading}
        pageSize={PAGE_SIZE}
      />
    </>
  );
};

export default withToasts(DatasourceList);
