"use client";
import React, { useState, useEffect, useRef, useCallback, JSX } from "react";
import Link from "next/link";
import styles from "./pagination.module.css";
import classNames from "classnames";
import { useSearchParams } from "next/navigation";
import Button from "../Buttons/Button Set 1/button";

export default function Pagination<T>({
  renderItem,
  title,
  collection,
  endpoint = "/api/pagination",
}: {
  renderItem: (item: T, index: number) => React.ReactNode;
  title?: string;
  //Which set of items to fetch; sent to the API as ?collection=..., not reflected in page links
  collection?: string;
  endpoint?: string;
}) {
  const DEFAULT_PAGE_SIZE = 12;
  const DEFAULT_SORT = "newest";
  const PAGE_SIZE_STORAGE_KEY = "preferredPageSize";
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [isError, setIsError] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [sort, setSort] = useState();
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const searchParams = useSearchParams();
  const hasFetched = useRef(false);

  //Fetches items from the backend
  const getItems = useCallback(async () => {
    try {
      const storedSize = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has("pagesize") && storedSize) {
        params.set("pagesize", storedSize);
      }
      if (collection) params.set("collection", collection);
      const res = await fetch(`${endpoint}?${params}`);
      const data = await res.json();
      if (!res.ok || data.errors) throw new Error();
      setPage(data.page);
      setNumPages(data.numPages);
      setSort(data.sort);
      setPageSize(data.pageSize);
      setItems(data.items);
      setIsError(false);
      hasFetched.current = true;
    } catch (error) {
      setIsError(true);
    }
  }, [searchParams, collection, endpoint]);

  useEffect(() => {
    getItems();
  }, [getItems]);

  // Persists the user's preferred page size to localStorage after the first fetch
  useEffect(() => {
    if (!hasFetched.current) return;
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize));
  }, [pageSize]);

  //Creates the sort menu at the top of component
  function sortOptions() {
    const sortLink = (text: string, sortOption: string, key: string) => {
      let params: string[] = [];
      if (sortOption !== DEFAULT_SORT) params.push(`sort=${sortOption}`);
      if (pageSize !== DEFAULT_PAGE_SIZE) params.push(`pagesize=${pageSize}`);
      const queryString = params.toString() ? `?${params.join("&")}` : "?";
      return (
        <Link
          href={queryString}
          key={key}
          className={classNames(styles.sort_option, {
            [styles.active]: sort === sortOption,
          })}
          aria-label={`Sort by ${sortOption}`}
        >
          {text}
        </Link>
      );
    };
    const sortOptionsArr: JSX.Element[] = [
      sortLink("Newest", "newest", "newest"),
      sortLink("Oldest", "oldest", "oldest"),
      sortLink("Popular", "popular", "popular"),
      sortLink("Best", "best", "best"),
    ];
    return (
      <div className={styles.sort_options} aria-label="Sort options">
        {sortOptionsArr}
      </div>
    );
  }

  //Creates a menu for changing page size at the top of the component
  function sizeOptions() {
    const sizeLink = (text: string, newPageSize: number) => {
      let params: string[] = [];
      if (sort !== DEFAULT_SORT) params.push(`sort=${sort}`);
      params.push(`pagesize=${newPageSize}`);
      const queryString = `?${params.join("&")}`;
      return (
        <Link
          href={queryString}
          key={newPageSize}
          className={classNames(styles.size_option, {
            [styles.active]: pageSize === newPageSize,
          })}
          aria-label={`Change page size to ${newPageSize} items`}
        >
          {text}
        </Link>
      );
    };
    const sizeOptionsArr: JSX.Element[] = [
      sizeLink("12", 12),
      sizeLink("24", 24),
      sizeLink("36", 36),
      sizeLink("48", 48),
    ];
    return (
      <div className={styles.size_options} aria-label="Page size options">
        {sizeOptionsArr}
      </div>
    );
  }

  //Creates the pagination menu
  function paginationMenu() {
    const menuLink = (
      text: string,
      page: number,
      key: string,
      className?: string,
      ariaLabel?: string,
    ) => {
      let params: string[] = [];
      if (page !== 1) params.push(`page=${page}`);
      if (pageSize !== DEFAULT_PAGE_SIZE) params.push(`pagesize=${pageSize}`);
      if (sort !== DEFAULT_SORT) params.push(`sort=${sort}`);
      const queryString = params.toString() ? `?${params.join("&")}` : "?";
      return (
        <Link
          href={queryString}
          key={key}
          className={styles[className || ``]}
          aria-label={ariaLabel ? ariaLabel : `Go to page ${page}`}
        >
          {text}
        </Link>
      );
    };
    const menuArr: JSX.Element[] = [];
    const range = 2; //The +/- range for clickable pages from the one you're on

    let startPage = Math.max(page - range, 1);
    let endPage = Math.min(page + range, numPages);
    if (endPage <= 1) return undefined; //Hides the menu when there's only one page
    if (startPage == 1) {
      endPage = Math.min(1 + 2 * range, numPages);
    }
    if (endPage == numPages) {
      startPage = Math.max(numPages - 2 * range, 1);
    }
    if (page > 1) {
      menuArr.push(
        menuLink("<", page - 1, "left-arrow", "arrow", "Previous page"),
      );
    }
    if (page > 1 + range && numPages > 2 * range + 1) {
      menuArr.push(menuLink("1", 1, `page-1`));
      if (startPage > 2) {
        menuArr.push(
          <div
            className={styles.ellipsis}
            key="left-ellipsis"
            aria-hidden={true}
          >
            {`...`}
          </div>,
        );
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      i === page
        ? menuArr.push(
            <div
              className={styles.current_page}
              key={`page-${page}`}
              aria-current="page"
            >
              {page}
            </div>,
          )
        : menuArr.push(menuLink(`${i}`, i, `page-${i}`));
    }
    if (page < numPages - range && numPages > 2 * range + 1) {
      if (endPage < numPages - 1) {
        menuArr.push(
          <div
            className={styles.ellipsis}
            key="right-ellipsis"
            aria-hidden={true}
          >
            {`...`}
          </div>,
        );
      }
      menuArr.push(menuLink(`${numPages}`, numPages, `page-${numPages}`));
    }
    if (page < numPages) {
      menuArr.push(
        menuLink(">", page + 1, "right-arrow", "arrow", "Next Page"),
      );
    }
    return (
      <nav className={styles.pagination_menu} aria-label="Pagination">
        {menuArr}
      </nav>
    );
  }

  //Creates the items displayed on the page
  function pageItems() {
    return (
      <ul className={styles.items_container} role="list">
        {items.map((item, i) => (
          <li key={i} role="listitem">
            {renderItem(item, i)}
          </li>
        ))}
      </ul>
    );
  }

  //Creates the title and option menus at the top of the component
  function header() {
    return (
      <div className={styles.pagination_header}>
        {title && <h1>{title}</h1>}
        <div className={styles.options_container}>
          {sortOptions()}
          {sizeOptions()}
        </div>
      </div>
    );
  }

  return isError ? (
    <div className={styles.pagination}>
      {header()}
      <div className={styles.error_container}>
        <div
          className={styles.error_message}
        >{`Something went wrong loading...`}</div>
        <Button text="Retry" variant="secondary" onClick={getItems} />
      </div>
    </div>
  ) : numPages ? (
    <div className={styles.pagination}>
      {header()}
      {pageItems()}
      {paginationMenu()}
    </div>
  ) : null;
}
