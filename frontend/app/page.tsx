"use client";

import { Button, VStack, Box, Flex, Input, IconButton } from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon, CheckIcon } from "@chakra-ui/icons";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import axios from "axios";

const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;

interface Todo {
  id: number;
  content: string;
  isEditing?: boolean;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState<string>("");

  // todoを取得
  const fetchTodos = async () => {
    const response = await axios.get(`${apiEndpoint}/todo/list`);
    setTodos(response.data);
  };

  // ページロード時にtodoを取得
  useEffect(() => {
    fetchTodos();
  }, []);

  // todoを追加
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault(); // ページリロードを防止
    await axios.post(`${apiEndpoint}/todo`, {
      content: newTodo,
    });
    setNewTodo("");
    fetchTodos();
  };

  // todoを削除
  const onDelete = async (id: number) => {
    await axios.delete(`${apiEndpoint}/todo/${id}`);
    fetchTodos();
  };

  // todoを編集
  const onEdit = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, isEditing: true } : todo
      )
    );
  };
  const onUpdate = async (id: number, content: string) => {
    await axios.put(`${apiEndpoint}/todo/${id}`, { content });
    fetchTodos();
  };

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{ height: "100vh" }}
    >
      <VStack spacing={4}>
        {todos.map((todo) => (
          <Flex key={todo.id}>
            {todo.isEditing ? (
              <>
                <Input
                  defaultValue={todo.content}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    onUpdate(todo.id, e.target.value);
                    setTodos(
                      todos.map((todo) =>
                        todo.id === todo.id
                          ? { ...todo, isEditing: false }
                          : todo
                      )
                    );
                  }}
                />
                <IconButton
                  aria-label="Submit edit"
                  onClick={(e: any) => {
                    onUpdate(todo.id, e.target.previousSibling.value);
                    setTodos(
                      todos.map((todo) =>
                        todo.id === todo.id
                          ? { ...todo, isEditing: false }
                          : todo
                      )
                    );
                  }}
                >
                  <CheckIcon />
                </IconButton>
              </>
            ) : (
              <>
                <Box p="2" boxShadow="base" flex="1">
                  {todo.content}
                </Box>
                <IconButton aria-label="Edit" onClick={() => onEdit(todo.id)}>
                  <EditIcon />
                </IconButton>
              </>
            )}
            <IconButton aria-label="Delete" onClick={() => onDelete(todo.id)}>
              <DeleteIcon />
            </IconButton>
          </Flex>
        ))}
        <form style={{ width: "100%" }} onSubmit={onSubmit}>
          <Flex>
            <Input
              placeholder="New task"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNewTodo(e.target.value)
              }
            />
            <Button colorScheme="teal" type="submit">
              <AddIcon />
            </Button>
          </Flex>
        </form>
      </VStack>
    </Flex>
  );
}
