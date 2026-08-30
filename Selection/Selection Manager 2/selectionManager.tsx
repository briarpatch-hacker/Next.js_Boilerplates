"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./selectionManager.module.css";
import classNames from "classnames";
import TrashIcon from "@/app/ui/icons/trash";
import Button from "@/app/ui/Buttons/Button Set 1/button";
import Modal from "@/app/ui/Modals/Modal Versatile Portal/modal";
import LoaderCircle from "@/app/ui/Loaders/Circle Loader 1/loader";
import LoaderFullscreen from "@/app/ui/Loaders/Loader Fullscreen/loaderFullscreen";
import DeleteConfirmation from "@/app/ui/Confirmation Box/confirmationBox";
import MessageBox from "@/app/ui/Message Box/messageBox";
import { useRouter } from "next/navigation";

/*
 *  id    - unique identifier, used to track which items to delete
 *  label - display text shown inside the item card
 *
 *  Add more fields to Item as needed for your project.
 */
export interface Item {
  id: string;
  label: string;
}

export function Item(item: Item) {
  return <div className={styles.item}>{item.label}</div>;
}

interface SelectionManagerProps {
  itemsArr: Item[];
  headlineText?: string;
  itemLabel?: string; // used in confirmation messages, e.g. "draft", "file", "photo"
  emptyMessage?: string;
}

export default function SelectionManager({
  itemsArr,
  headlineText = "Your Items",
  itemLabel = "item",
  emptyMessage = "You don't have any items currently.",
}: SelectionManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(itemsArr);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const confirmDeleteMessage = useRef("");

  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const checkboxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastCheckboxChecked = useRef(0);

  useEffect(() => {
    if (showDeleteMenu) {
      window.addEventListener("keydown", handleKeydown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [showDeleteMenu, showDeleteButton]);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      closeDeleteMenu();
    } else if (e.key === "Backspace") {
      if (showDeleteButton) {
        confirmDeletion();
      }
    }
  }

  function openDeleteMenu() {
    lastCheckboxChecked.current = 0;
    setShowDeleteMenu(true);
  }

  function closeDeleteMenu() {
    setShowDeleteMenu(false);
    setShowDeleteButton(false);
  }

  //Allows shift click selecting of checkboxes
  function handleCheckboxClick(e: React.MouseEvent, index: number) {
    checkboxRefs.current.some((checkbox) => {
      return checkbox?.checked === true;
    })
      ? setShowDeleteButton(true)
      : setShowDeleteButton(false);
    if (e.shiftKey && checkboxRefs.current[index]?.checked) {
      for (
        let i = Math.min(index, lastCheckboxChecked.current);
        i < Math.max(index, lastCheckboxChecked.current);
        i++
      ) {
        const checkbox = checkboxRefs.current[i];
        if (checkbox) {
          checkbox.checked = true;
        }
      }
    }
    if (checkboxRefs.current[index]?.checked) {
      lastCheckboxChecked.current = index;
    } else {
      if (selectAllRef.current) {
        selectAllRef.current.checked = false;
      }
    }
    const allChecked = checkboxRefs.current.every(
      (checkbox) => checkbox?.checked === true,
    );
    if (selectAllRef.current) {
      selectAllRef.current.checked = allChecked;
    }
  }

  //Does identical things as handleCheckboxClick for keydown
  function handleCheckboxKeydown(
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) {
    if (e.key === "Enter" || e.key === "Space") {
      const checkbox = checkboxRefs.current[index];
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      if (e.shiftKey && checkboxRefs.current[index]?.checked) {
        for (
          let i = Math.min(index, lastCheckboxChecked.current);
          i < Math.max(index, lastCheckboxChecked.current);
          i++
        ) {
          const checkbox = checkboxRefs.current[i];
          if (checkbox) {
            checkbox.checked = true;
          }
        }
      }
      if (checkboxRefs.current[index]?.checked) {
        lastCheckboxChecked.current = index;
      } else {
        if (selectAllRef.current) {
          selectAllRef.current.checked = false;
        }
      }
      checkboxRefs.current.some((checkbox) => {
        return checkbox?.checked === true;
      })
        ? setShowDeleteButton(true)
        : setShowDeleteButton(false);
      const allChecked = checkboxRefs.current.every(
        (checkbox) => checkbox?.checked === true,
      );
      if (selectAllRef.current) {
        selectAllRef.current.checked = allChecked;
      }
    }
  }

  //Deletes all entries selected
  async function deleteEntries() {
    setShowConfirmDelete(false);
    setShowLoading(true);
    const indexesToBeDeleted = checkboxRefs.current
      .map((checkbox, index) => (checkbox?.checked === true ? index : -1))
      .filter((index) => index !== -1);
    const itemsToBeDeleted = checkboxRefs.current
      .map((checkbox) =>
        checkbox?.checked === true ? checkbox.dataset.itemId : null
      )
      .filter((id): id is string => id !== null);
    const options = {
      method: "DELETE",
      body: JSON.stringify({ items: itemsToBeDeleted }),
      headers: { "Content-Type": "application/json" },
    };
    // TODO: replace with your delete endpoint
    const res = await fetch("/api/deleteItems", options);
    const data = await res.json();
    if (data.success) {
      const newItems: Item[] = [];
      items.map((item, index) => {
        indexesToBeDeleted[0] === index
          ? indexesToBeDeleted.shift()
          : newItems.push(item);
      });
      setItems(newItems);
    } else {
      if (data.logout) {
        router.push("/login");
      }
    }
    setShowLoading(false);
    setShowDeleteButton(false);
    setShowDeleteMenu(false);
  }

  // Opens the dialog box to confirm deleting the entries
  function confirmDeletion() {
    const count = checkboxRefs.current.filter((cb) => cb?.checked).length;
    const plural = count > 1;
    const all = count === items.length && plural;
    let message = `Are you sure you want to delete `;
    if (all) {
      message += `all of your `;
    } else {
      message += plural ? `these ${count} ` : `this `;
    }
    message += `${itemLabel}${plural ? "s" : ""}? You won't be able to get ${plural ? "them" : "it"} back.`;
    confirmDeleteMessage.current = message;
    setShowConfirmDelete(true);
  }

  function handleSelectAll() {
    if (selectAllRef.current && selectAllRef.current.checked) {
      checkboxRefs.current.forEach((checkbox) => {
        if (checkbox) {
          checkbox.checked = true;
        }
      });
      setShowDeleteButton(true);
    } else {
      checkboxRefs.current.forEach((checkbox) => {
        if (checkbox) {
          checkbox.checked = false;
        }
      });
      setShowDeleteButton(false);
    }
  }

  function handleSelectAllKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (selectAllRef.current) {
        selectAllRef.current.checked = !selectAllRef.current.checked;
        handleSelectAll();
      }
    }
  }

  return items.length > 0 ? (
    <div className={styles.selection_manager}>
      {showConfirmDelete && (
        <Modal
          closeFunction={() => setShowConfirmDelete(false)}
          animate={true}
          unstyled={true}
        >
          <DeleteConfirmation
            message={confirmDeleteMessage.current}
            onConfirm={deleteEntries}
            onCancel={() => setShowConfirmDelete(false)}
            ariaLabel={`Confirm Deletion Panel`}
          />
        </Modal>
      )}
      {showLoading && (
        <LoaderFullscreen ariaLabel={`Deleting... Please wait.`}>
          <LoaderCircle />
        </LoaderFullscreen>
      )}
      <div className={styles.content_wrapper}>
        <div
          className={classNames(styles.selection_manager_header, {
            [styles.show_delete_menu]: showDeleteMenu,
          })}
        >
          <h1>{headlineText}</h1>
          <div>
            {!showDeleteMenu && (
              <div className={styles.trash_btn_wrapper}>
                <Button
                  variant="tertiary"
                  onClick={openDeleteMenu}
                  title="Open Delete Menu"
                  width="smallest"
                >
                  <TrashIcon />
                </Button>
              </div>
            )}
          </div>
        </div>
        {showDeleteMenu && (
          <div className={styles.delete_menu}>
            <Button
              variant="tertiary"
              title="Close Delete Menu"
              onClick={closeDeleteMenu}
              style={{}}
            >{`Cancel`}</Button>
            {showDeleteButton ? (
              <Button
                variant="primary"
                title="Delete selected items"
                onClick={confirmDeletion}
              >{`Delete`}</Button>
            ) : (
              <Button
                variant="tertiary"
                style={{
                  color: "rgb(150,150,150)",
                  borderColor: "rgb(150,150,150)",
                  borderWidth: "0rem",
                  borderTopWidth: "0.05rem",
                  fontWeight: "100",
                  opacity: "0.6",
                }}
                ariaLabel="Select items to enable this delete button"
                aria-disabled="true"
                tabIndex={-1}
                disabled={true}
                onClick={() => {}}
              >{`Delete`}</Button>
            )}
          </div>
        )}
        <div className={styles.entries_wrapper}>
          {showDeleteMenu && (
            <div className={styles.select_all_wrapper}>
              <input
                type={"checkbox"}
                className={styles.checkbox}
                onClick={handleSelectAll}
                onKeyDown={handleSelectAllKeydown}
                ref={selectAllRef}
                aria-label="Select all items"
              />
              <div>{`Select All`}</div>
            </div>
          )}
          {items.map((item, index) => {
            return (
              <div className={styles.entry_row} key={`row-${index}`}>
                {showDeleteMenu && (
                  <div className={styles.checkbox_wrapper}>
                    <input
                      type={"checkbox"}
                      className={styles.checkbox}
                      ref={(el) => {
                        checkboxRefs.current[index] = el;
                      }}
                      onClick={(e) => handleCheckboxClick(e, index)}
                      onKeyDown={(e) => handleCheckboxKeydown(e, index)}
                      data-item-id={item.id}
                      aria-label={
                        checkboxRefs.current[index]?.checked
                          ? `Deselect item`
                          : `Select item`
                      }
                    />
                  </div>
                )}
                <Item id={item.id} label={item.label} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  ) : (
    <div className={styles.selection_manager}>
      <MessageBox
        message={emptyMessage}
        ariaLive="polite"
        role="status"
      />
    </div>
  );
}
