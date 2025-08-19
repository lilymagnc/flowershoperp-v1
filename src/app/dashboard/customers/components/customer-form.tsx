
"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEffect } from "react"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import type { Customer } from "@/hooks/use-customers"
const customerSchema = z.object({
  name: z.string().min(1, "고객명을 입력해주세요."),
  type: z.enum(["personal", "company"]).default("personal"),
  companyName: z.string().optional(),
  contact: z.string().min(1, "연락처를 입력해주세요."),
  email: z.string().email("유효한 이메일을 입력해주세요.").optional().or(z.literal('')),
  grade: z.string().optional(),
  tags: z.string().optional(),
  birthday: z.date().optional().nullable(),
  anniversary: z.date().optional().nullable(),
  memo: z.string().optional(),
  // Business fields
  businessNumber: z.string().optional(),
  ceoName: z.string().optional(),
  businessType: z.string().optional(),
  businessItem: z.string().optional(),
  businessAddress: z.string().optional(),
});
export type CustomerFormValues = z.infer<typeof customerSchema>
interface CustomerFormProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (data: CustomerFormValues) => void
  customer?: Customer | null
}
const defaultValues: CustomerFormValues = {
  name: "",
  type: "personal",
  companyName: "",
  contact: "",
  email: "",
  grade: "신규",
  tags: "",
  birthday: null,
  anniversary: null,
  memo: "",
  businessNumber: "",
  ceoName: "",
  businessType: "",
  businessItem: "",
  businessAddress: "",
}
export function CustomerForm({ isOpen, onOpenChange, onSubmit, customer }: CustomerFormProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  })
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        form.reset({
          ...customer,
          birthday: customer.birthday ? new Date(customer.birthday) : null,
          anniversary: customer.anniversary ? new Date(customer.anniversary) : null,
        });
      } else {
        form.reset(defaultValues);
      }
    }
  }, [customer, form, isOpen]);
  const handleFormSubmit = (data: CustomerFormValues) => {
    onSubmit(data);
  }
  const customerType = form.watch("type");
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer ? "고객 정보 수정" : "새 고객 추가"}</DialogTitle>
          <DialogDescription>고객의 상세 정보를 입력하고 관리합니다.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>고객 유형</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="personal">개인</SelectItem>
                        <SelectItem value="company">기업</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Separator />
            <p className="text-sm font-semibold">담당자 정보</p>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{customerType === 'company' ? '담당자명' : '고객명'}</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처</FormLabel>
                    <FormControl>
                      <Input placeholder="010-1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input placeholder="customer@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>고객 등급</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="등급 선택" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="신규">신규</SelectItem>
                            <SelectItem value="일반">일반</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="VVIP">VVIP</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Separator className="my-6" />
            <p className="text-sm font-semibold">추가 정보</p>
            <Separator />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>태그</FormLabel>
                  <FormControl>
                    <Input placeholder="기념일, 단체주문 (쉼표로 구분)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>생일</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "yyyy년 MM월 dd일", { locale: ko }) : <span>날짜 선택</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                locale={ko}
                                mode="single"
                                selected={field.value ?? undefined}
                                onSelect={field.onChange}
                                captionLayout="dropdown-buttons"
                                fromYear={1920}
                                toYear={new Date().getFullYear()}
                                classNames={{
                                  caption_label: 'text-lg font-medium',
                                  caption_dropdowns: 'flex flex-row-reverse gap-1 text-xs',
                                  vhidden: 'hidden',
                                }}
                             />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="anniversary"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>결혼 기념일</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "yyyy년 MM월 dd일", { locale: ko }) : <span>날짜 선택</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar 
                                locale={ko}
                                mode="single" 
                                selected={field.value ?? undefined}
                                onSelect={field.onChange}
                                captionLayout="dropdown-buttons"
                                fromYear={1950}
                                toYear={new Date().getFullYear()}
                                classNames={{
                                  caption_label: 'text-lg font-medium',
                                  caption_dropdowns: 'flex flex-row-reverse gap-1 text-xs',
                                  vhidden: 'hidden',
                                }}
                             />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            {customerType === 'company' && (
              <>
                <Separator className="my-6" />
                <p className="text-sm font-semibold">사업자 정보 (세금계산서 발행용)</p>
                <Separator />
                <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>회사명</FormLabel>
                      <FormControl><Input placeholder="꽃길 주식회사" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="businessNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>사업자등록번호</FormLabel>
                        <FormControl><Input placeholder="123-45-67890" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                  )}/>
                  <FormField control={form.control} name="ceoName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>대표자명</FormLabel>
                        <FormControl><Input placeholder="홍길동" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                  )}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="businessType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>업태</FormLabel>
                        <FormControl><Input placeholder="소매업" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                  )}/>
                  <FormField control={form.control} name="businessItem" render={({ field }) => (
                      <FormItem>
                        <FormLabel>종목</FormLabel>
                        <FormControl><Input placeholder="전자상거래업" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                  )}/>
                </div>
                <FormField control={form.control} name="businessAddress" render={({ field }) => (
                    <FormItem>
                        <FormLabel>사업장 주소</FormLabel>
                        <FormControl><Textarea placeholder="상세 주소 입력" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
              </>
            )}
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모</FormLabel>
                  <FormControl>
                    <Textarea placeholder="고객 관련 특이사항 기록" {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary">취소</Button>
              </DialogClose>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
