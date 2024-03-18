import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import "./home.scss";
import moment from "moment-timezone";

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);

  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== "undefined") {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };

  const handleListKeyDown = (e, id) => {
    if (e.key === " " || e.key === "Enter") {
      handleSelectList(id);
    } else if (e.key === "ArrowRight") {
        const nextListItem = e.currentTarget.nextElementSibling;
        if (nextListItem) {
            nextListItem.focus();
        }
    } else if (e.key === "ArrowLeft") {
        const prevListItem = e.currentTarget.previousElementSibling;
        if (prevListItem) {
            prevListItem.focus();
        }
    }
  };

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab" role="tablist">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  className={`list-tab-item ${isActive ? "active" : ""}`}
                  role="tab"
                  tabIndex={0}
                  aria-selected={isActive ? "true" : " false"}
                  onClick={() => handleSelectList(list.id)}
                  onKeyDown={(e) => {
                      if ([" ", "Enter", "ArrowRight", "ArrowLeft"].includes(e.key)) {
                          handleListKeyDown(e, list.id);
                      }
                  }}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks" role="tabpanel">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// 残り日時の計算
const calculateRemainingTime = (limitDateTime) => {
  const currentDateTime = new Date();
  const timeDifference = limitDateTime.getTime() - currentDateTime.getTime();

  if (timeDifference < 0) {
    return "期限を超過しています";
  }

  const remainingYears = Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 365));
  const remainingDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  const remainingTime = remainingYears + "年" + remainingDays + "日" + remainingHours + "時間" + remainingMinutes + "分";

  return remainingTime;
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  if (tasks === null) return <></>;

  if (isDoneDisplay === "done") {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true;
          })
          .map((task, key) => {
            // 期限日時を取得
            const limitDateTime = new Date(task.limit);
            const remainingTime = calculateRemainingTime(limitDateTime);
            
            return (
              <li key={key} className="task-item">
                <Link
                  to={`/lists/${selectListId}/tasks/${task.id}`}
                  className="task-item-link"
                >
                  {task.title}
                  <br />
                  {task.done ? "完了" : "未完了"}
                  <br />
                  <div className="task-item-limit">
                    期限日時：{moment(task.limit).format("YYYY年MM月DD日 HH:mm")}
                    <br />
                    残り日時：{remainingTime}
                  </div>
                </Link>
              </li>
            );
          })}
      </ul>
    );
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false;
        })
        .map((task, key) => {
          // 期限日時を取得
          const limitDateTime = new Date(task.limit);
          const remainingTime = calculateRemainingTime(limitDateTime);

          return (
            <li key={key} className="task-item">
              <Link
                to={`/lists/${selectListId}/tasks/${task.id}`}
                className="task-item-link"
              >
                {task.title}
                <br />
                {task.done ? "完了" : "未完了"}
                <div className="task-item-limit">
                  期限日時：{moment(task.limit).format("YYYY年MM月DD日 HH:mm")}
                  <br />
                  残り日時：{remainingTime}
                </div>
              </Link>
            </li>
          );
        })}
    </ul>
  );
};
