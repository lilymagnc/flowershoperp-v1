
"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface OrderPrintData {
    orderDate: string;
    ordererName: string;
    ordererContact: string;
    items: string;
    totalAmount: number;
    deliveryFee: number;
    paymentMethod: string;
    paymentStatus: '미결' | '완결' | string;
    deliveryDate: string;
    recipientName: string;
    recipientContact: string;
    deliveryAddress: string;
    message: string;
    isAnonymous: boolean;
    branchInfo: {
        name: string;
        address: string;
        contact: string;
        account: string;
    };
}

interface PrintableOrderProps {
    data: OrderPrintData | null;
}

const paymentMethodMap = {
    card: "카드",
    cash: "현금",
    transfer: "계좌이체",
    mainpay: "메인페이",
    shopping_mall: "쇼핑몰",
    epay: "이페이"
};

// Use a class component to ensure compatibility with react-to-print's ref handling.
export class PrintableOrder extends React.Component<PrintableOrderProps> {
    state = {
        brandLogo: 'https://ecimg.cafe24img.com/pg1472b45444056090/lilymagflower/web/upload/category/logo/v2_d13ecd48bab61a0269fab4ecbe56ce07_lZMUZ1lORo_top.jpg',
        brandName: '플라워샵', // TODO: useSettings에서 동적으로 가져오기
        brandContactPhone: '010-2385-9518',
        brandAddress: '서울특별시 종로구 광화문로 123',
        businessNumber: '123-45-67890',
        onlineShoppingMall: 'www.lilymagshop.co.kr'
    };

    componentDidMount() {
        this.loadBrandSettings();
    }

    loadBrandSettings = async () => {
        try {
            const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
            if (settingsDoc.exists()) {
                const settings = settingsDoc.data();
                
                this.setState({
                    brandLogo: settings.brandLogo || this.state.brandLogo,
                    brandName: settings.brandName || this.state.brandName,
                    brandContactPhone: settings.brandContactPhone || this.state.brandContactPhone,
                    brandAddress: settings.brandAddress || this.state.brandAddress,
                    businessNumber: settings.businessNumber || this.state.businessNumber,
                    onlineShoppingMall: settings.onlineShoppingMall || this.state.onlineShoppingMall
                });
            }
        } catch (error) {
            // 브랜드 설정 로드 실패 시 기본값 사용
        }
    };

    render() {
        const { data } = this.props;
        const { brandLogo, brandName, brandContactPhone, brandAddress, businessNumber, onlineShoppingMall } = this.state;
        
        if (!data) return null;
        
        const Checkbox = ({ checked }: { checked: boolean }) => (
            <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '1px solid black', marginRight: '4px', position: 'relative', verticalAlign: 'middle' }}>
                {checked && <span style={{ position: 'absolute', top: '-3px', left: '2px', fontSize: '14px' }}>✔</span>}
            </span>
        );
        
        const paymentMethodText = paymentMethodMap[data.paymentMethod as keyof typeof paymentMethodMap] || data.paymentMethod;
        
        const renderSection = (title: string, isReceipt: boolean) => (
            <div className="mb-4">
                <div className="text-center mb-4">
                    { !isReceipt && (
                        <>
                        <Image
                            src={brandLogo}
                            alt="Logo"
                            width={150}
                            height={60}
                            className="mx-auto"
                            style={{ width: '150px', height: 'auto' }}
                            priority
                            unoptimized
                            sizes="150px"
                        />
                        <h1 className="text-2xl font-bold mt-2">{brandName} {title}</h1>
                        </>
                    )}
                    { isReceipt && (
                        <>
                            <Image
                                src={brandLogo}
                                alt="Logo"
                                width={100}
                                height={40}
                                className="mx-auto"
                                style={{ width: '100px', height: 'auto' }}
                                priority
                                unoptimized
                                sizes="100px"
                            />
                            <h1 className="text-2xl font-bold mt-2">{title}</h1>
                        </>
                    )}
                </div>
                <table className="w-full border-collapse border border-black text-sm">
                    <tbody>
                        <tr>
                            <td className="border border-black p-1 font-bold w-[15%]">주문일</td>
                            <td className="border border-black p-1 w-[25%]">{data.orderDate}</td>
                            <td className="border border-black p-1 font-bold w-[10%]">주문자</td>
                            <td className="border border-black p-1 w-[15%]">{data.isAnonymous && isReceipt ? '익명' : data.ordererName}</td>
                            <td className="border border-black p-1 font-bold w-[10%]">연락처</td>
                            <td className="border border-black p-1 w-[25%]">{data.isAnonymous && isReceipt ? '-' : data.ordererContact}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold align-top h-12">항목/수량</td>
                            <td className="border border-black p-1 align-top whitespace-pre-wrap" colSpan={5}>{data.items}</td>
                        </tr>
                         {!isReceipt && (
                            <>
                                <tr>
                                    <td className="border border-black p-1 font-bold">결제정보</td>
                                    <td className="border border-black p-1" colSpan={5}>
                                        <div className="flex items-center justify-between">
                                            <span>금액: ₩{data.totalAmount.toLocaleString()}</span>
                                            <span>배송비: ₩{data.deliveryFee.toLocaleString()}</span>
                                            <div className="flex items-center gap-2">
                                                <span>결제수단: {paymentMethodText}</span>
                                                <div className="flex items-center gap-2 pr-2">
                                                    <div className="flex items-center"><Checkbox checked={data.paymentStatus === '미결'} /><span>미결</span></div>
                                                    <div className="flex items-center"><Checkbox checked={data.paymentStatus === '완결'} /><span>완결</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </>
                        )}
                        <tr>
                            <td className="border border-black p-1 font-bold">배송일/시간</td>
                            <td className="border border-black p-1">{data.deliveryDate}</td>
                            <td className="border border-black p-1 font-bold">받는 분</td>
                            <td className="border border-black p-1">{data.recipientName}</td>
                            <td className="border border-black p-1 font-bold">연락처</td>
                            <td className="border border-black p-1">{data.recipientContact}</td>
                        </tr>
                        <tr>
                            <td className={`border border-black p-1 font-bold align-top ${isReceipt ? 'h-20' : 'h-16'}`}>배송지주소</td>
                            <td colSpan={5} className="border border-black p-1 align-top">{data.deliveryAddress}</td>
                        </tr>
                        {!isReceipt && (
                            <tr>
                                <td className="border border-black p-1 font-bold align-top h-16">전달메세지<br/>(카드/리본)</td>
                                <td colSpan={5} className="border border-black p-1 align-top">{data.message}</td>
                            </tr>
                        )}
                        {isReceipt && (
                            <tr>
                                <td className="border border-black p-1 font-bold">인수자성명</td>
                                <td colSpan={5} className="border border-black p-1 h-16"></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
        return (
            <div className="p-4 bg-white text-black font-sans">
                {renderSection('주문서', false)}
                <div className="border-t-2 border-dashed border-gray-400 my-8"></div>
                {renderSection('인수증', true)}
                <div className="mt-8">
                    <table className="w-full border-collapse border-black text-xs">
                         <tbody>
                            <tr>
                                <td className="border border-black p-1 font-bold w-[12%]">상호명</td>
                                <td className="border border-black p-1 w-[38%]">{brandName}</td>
                                <td className="border border-black p-1 font-bold w-[12%]">연락처</td>
                                <td className="border border-black p-1 w-[38%]">{brandContactPhone}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 font-bold">주소</td>
                                <td className="border border-black p-1" colSpan={3}>{brandAddress}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 font-bold">사업자번호</td>
                                <td className="border border-black p-1">{businessNumber}</td>
                                <td className="border border-black p-1 font-bold">온라인쇼핑몰</td>
                                <td className="border border-black p-1">{onlineShoppingMall}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}
