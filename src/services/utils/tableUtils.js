export const paginationProps = (onChange=()=>{})=> {
    return {
        hideOnSinglePage:true,
        defaultPageSize: 12,
        pageSize:12,
        showSizeChanger:false,
        size:"small",
        onChange
    };
};

export const modalProps = ()=> {
    return {
        destroyOnClose: true,
        footer:null
    };
};