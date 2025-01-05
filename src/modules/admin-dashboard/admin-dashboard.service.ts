import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

import { Invoice, InvoiceDocument } from '../invoice/entities/invoice.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { Booking, BookingDocument } from '../booking/entities/booking.entity';
import { Room, RoomDocument } from '../room/entities/room.entity';
import {
	RoomType,
	RoomTypeDocument,
} from '../roomType/entities/roomType.entity';
import { Service, ServiceDocument } from '../service/entities/service.entity';
import {
	ServiceType,
	ServiceTypeDocument,
} from '../serviceType/entities/serviceType.entity';
import {
	Promotion,
	PromotionDocument,
} from '../promotion/entities/promotion.entity';

@Injectable()
export class AdminDashboardService {
	private readonly logger = new Logger(AdminDashboardService.name);

	constructor(
		@InjectModel(Invoice.name)
		private readonly invoiceModel: Model<InvoiceDocument>,
		@InjectModel(User.name)
		private readonly userModel: Model<UserDocument>,
		@InjectModel(Booking.name)
		private readonly bookingModel: Model<BookingDocument>,
		@InjectModel(Room.name)
		private readonly roomModel: Model<RoomDocument>,
		@InjectModel(RoomType.name)
		private readonly roomTypeModel: Model<RoomTypeDocument>,
		@InjectModel(Service.name)
		private readonly serviceModel: Model<ServiceDocument>,
		@InjectModel(ServiceType.name)
		private readonly serviceTypeModel: Model<ServiceTypeDocument>,
		@InjectModel(Promotion.name)
		private readonly promotionModel: Model<PromotionDocument>,
	) {}

	private calculateGrowth(current: number, previous: number): number {
		if (previous === 0) return current === 0 ? 0 : 100;
		return ((current - previous) / previous) * 100;
	}

	public async getInvoices(dateRange: { start: Date; end: Date }) {
		return this.invoiceModel
			.find({
				createdAt: {
					$gte: dateRange.start,
					$lt: dateRange.end,
				},
			})
			.exec();
	}

	async getDailyRevenue(): Promise<{ revenue: number; growth: number }> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const [todayRevenue, yesterdayRevenue] = await Promise.all([
			this.invoiceModel.aggregate([
				{ $match: { createdAt: { $gte: today } } },
				{ $group: { _id: null, total: { $sum: '$amount' } } },
			]),
			this.invoiceModel.aggregate([
				{ $match: { createdAt: { $gte: yesterday, $lt: today } } },
				{ $group: { _id: null, total: { $sum: '$amount' } } },
			]),
		]);

		const revenue = todayRevenue[0]?.total || 0;
		const previousRevenue = yesterdayRevenue[0]?.total || 0;
		const growth = this.calculateGrowth(revenue, previousRevenue);

		return { revenue, growth };
	}

	async getDailyCustomerGrowth(): Promise<{
		customers: number;
		growth: number;
	}> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const [todayCustomers, yesterdayCustomers] = await Promise.all([
			this.userModel.countDocuments({ createdAt: { $gte: today } }).exec(),
			this.userModel
				.countDocuments({ createdAt: { $gte: yesterday, $lt: today } })
				.exec(),
		]);

		const customers = todayCustomers;
		const previousCustomers = yesterdayCustomers;
		const growth = this.calculateGrowth(customers, previousCustomers);

		return { customers, growth };
	}

	async getYearlyRevenue(): Promise<{
		currentYearRevenue: number;
		lastYearRevenue: number;
		currentYearMonthlyRevenue: number[];
		lastYearMonthlyRevenue: number[];
		growth: number;
	}> {
		const currentYear = new Date().getFullYear();
		const lastYear = currentYear - 1;

		const [
			currentYearRevenue,
			lastYearRevenue,
			currentYearMonthlyRevenue,
			lastYearMonthlyRevenue,
		] = await Promise.all([
			this.invoiceModel.aggregate([
				{
					$match: {
						createdAt: {
							$gte: new Date(`${currentYear}-01-01`),
							$lt: new Date(`${currentYear + 1}-01-01`),
						},
					},
				},
				{ $group: { _id: null, total: { $sum: '$amount' } } },
			]),
			this.invoiceModel.aggregate([
				{
					$match: {
						createdAt: {
							$gte: new Date(`${lastYear}-01-01`),
							$lt: new Date(`${currentYear}-01-01`),
						},
					},
				},
				{ $group: { _id: null, total: { $sum: '$amount' } } },
			]),
			this.invoiceModel.aggregate([
				{
					$match: {
						createdAt: {
							$gte: new Date(`${currentYear}-01-01`),
							$lt: new Date(`${currentYear + 1}-01-01`),
						},
					},
				},
				{
					$group: {
						_id: { $month: '$createdAt' },
						total: { $sum: '$amount' },
					},
				},
				{ $sort: { _id: 1 } },
			]),
			this.invoiceModel.aggregate([
				{
					$match: {
						createdAt: {
							$gte: new Date(`${lastYear}-01-01`),
							$lt: new Date(`${currentYear}-01-01`),
						},
					},
				},
				{
					$group: {
						_id: { $month: '$createdAt' },
						total: { $sum: '$amount' },
					},
				},
				{ $sort: { _id: 1 } },
			]),
		]);

		const revenue = currentYearRevenue[0]?.total || 0;
		const previousRevenue = lastYearRevenue[0]?.total || 0;
		const growth = this.calculateGrowth(revenue, previousRevenue);

		const currentYearMonthlyRevenueArray = new Array(12).fill(0);
		const lastYearMonthlyRevenueArray = new Array(12).fill(0);

		currentYearMonthlyRevenue.forEach((month) => {
			currentYearMonthlyRevenueArray[month._id - 1] = month.total;
		});

		lastYearMonthlyRevenue.forEach((month) => {
			lastYearMonthlyRevenueArray[month._id - 1] = month.total;
		});

		return {
			currentYearRevenue: revenue,
			lastYearRevenue: previousRevenue,
			currentYearMonthlyRevenue: currentYearMonthlyRevenueArray,
			lastYearMonthlyRevenue: lastYearMonthlyRevenueArray,
			growth,
		};
	}

	public async getRevenueByRoomType(dateRange: { start: Date; end: Date }) {
		const pipeline: any[] = [
			{
				$match: {
					createdAt: {
						$gte: dateRange.start,
						$lt: dateRange.end,
					},
					bookingId: { $exists: true },
				},
			},
			{
				$addFields: {
					bookingIdObj: { $toObjectId: '$bookingId' },
				},
			},
			{
				$lookup: {
					from: 'bookings',
					localField: 'bookingIdObj',
					foreignField: '_id',
					as: 'booking',
				},
			},
			{
				$unwind: '$booking',
			},
			{
				$addFields: {
					roomIdObj: { $toObjectId: '$booking.roomId' },
				},
			},
			{
				$lookup: {
					from: 'rooms',
					localField: 'roomIdObj',
					foreignField: '_id',
					as: 'room',
				},
			},
			{
				$unwind: '$room',
			},
			{
				$addFields: {
					roomTypeIdObj: { $toObjectId: '$room.roomTypeId' },
				},
			},
			{
				$lookup: {
					from: 'roomtypes',
					localField: 'roomTypeIdObj',
					foreignField: '_id',
					as: 'roomType',
				},
			},
			{
				$unwind: '$roomType',
			},
			{
				$group: {
					_id: '$roomType.typeName',
					totalRevenue: { $sum: '$amount' },
				},
			},
			{
				$project: {
					_id: 0,
					roomType: '$_id',
					revenue: '$totalRevenue',
				},
			},
			{
				$sort: {
					roomType: 1,
				},
			},
		];

		return this.invoiceModel.aggregate(pipeline).exec();
	}

	public async getRevenueByService(dateRange: { start: Date; end: Date }) {
		const pipeline: any[] = [
			{
				$match: {
					createdAt: {
						$gte: dateRange.start,
						$lt: dateRange.end,
					},
				},
			},
			{
				$unwind: {
					path: '$services',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'services',
					localField: 'services.serviceId',
					foreignField: '_id',
					as: 'serviceDetails',
				},
			},
			{
				$unwind: {
					path: '$serviceDetails',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$group: {
					_id: '$serviceDetails.serviceName',
					totalRevenue: {
						$sum: {
							$cond: {
								if: { $gt: ['$services', null] },
								then: { $multiply: ['$services.price', '$services.quantity'] },
								else: 0,
							},
						},
					},
				},
			},
			{
				$project: {
					_id: 0,
					serviceName: '$_id',
					revenue: '$totalRevenue',
				},
			},
			{
				$sort: {
					serviceName: 1,
				},
			},
		];

		return this.bookingModel.aggregate(pipeline).exec();
	}

	public async getRevenueByServiceForLast5Years() {
		const currentYear = new Date().getFullYear();
		const startYear = currentYear - 5;
		const pipeline: any[] = [
			{
				$match: {
					createdAt: {
						$gte: new Date(`${startYear}-01-01`),
						$lt: new Date(`${currentYear + 1}-01-01`),
					},
				},
			},
			{
				$unwind: {
					path: '$services',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'services',
					localField: 'services.serviceId',
					foreignField: '_id',
					as: 'serviceDetails',
				},
			},
			{
				$unwind: {
					path: '$serviceDetails',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$group: {
					_id: {
						year: { $year: '$createdAt' },
						serviceName: '$serviceDetails.serviceName',
					},
					totalRevenue: {
						$sum: {
							$cond: {
								if: { $gt: ['$services', null] },
								then: { $multiply: ['$services.price', '$services.quantity'] },
								else: 0,
							},
						},
					},
				},
			},
			{
				$project: {
					_id: 0,
					year: '$_id.year',
					serviceName: '$_id.serviceName',
					revenue: '$totalRevenue',
				},
			},
			{
				$sort: {
					year: 1,
					serviceName: 1,
				},
			},
		];

		const results = await this.bookingModel.aggregate(pipeline).exec();

		const allServices = await this.serviceModel.find().exec();
		const serviceNames = allServices.map((service) => service.serviceName);

		const groupedResults = {};
		results.forEach((result) => {
			if (!groupedResults[result.year]) {
				groupedResults[result.year] = {};
			}
			groupedResults[result.year][result.serviceName] = result.revenue;
		});

		const finalResults = [];
		for (let year = startYear; year <= currentYear; year++) {
			const yearData = { year, services: {} };
			serviceNames.forEach((serviceName) => {
				yearData.services[serviceName] =
					groupedResults[year]?.[serviceName] || 0;
			});
			finalResults.push(yearData);
		}

		return finalResults;
	}

	async exportToExcel(res: Response) {
		const workbook = new ExcelJS.Workbook();
		const today = new Date();
		const startOfToday = new Date(today.setHours(0, 0, 0, 0));
		const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		const startOfYear = new Date(today.getFullYear(), 0, 1);

		const dateRanges = {
			today: {
				start: startOfToday,
				end: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000),
			},
			thisMonth: {
				start: startOfMonth,
				end: new Date(startOfMonth.getTime() + 31 * 24 * 60 * 60 * 1000),
			},
			thisYear: {
				start: startOfYear,
				end: new Date(startOfYear.getTime() + 365 * 24 * 60 * 60 * 1000),
			},
		};

		for (const [key, dateRange] of Object.entries(dateRanges)) {
			const invoices = await this.getInvoices(dateRange);
			const revenueByService = await this.getRevenueByService(dateRange);
			const revenueByRoomType = await this.getRevenueByRoomType(dateRange);

			const invoiceSheet = workbook.addWorksheet(`Invoices - ${key}`);
			invoiceSheet.columns = [
				{ header: 'Invoice ID', key: 'id', width: 30 },
				{ header: 'User ID', key: 'userId', width: 30 },
				{ header: 'Amount', key: 'amount', width: 15 },
				{ header: 'Description', key: 'description', width: 30 },
				{ header: 'Status', key: 'status', width: 15 },
				{ header: 'Issue Date', key: 'issueDate', width: 20 },
				{ header: 'Due Date', key: 'dueDate', width: 20 },
			];
			invoices.forEach((invoice) => {
				invoiceSheet.addRow({
					id: invoice._id.toString(),
					userId: invoice.userId.toString(),
					amount: invoice.amount,
					description: invoice.description,
					status: invoice.status,
					issueDate: invoice.issueDate,
					dueDate: invoice.dueDate,
				});
			});

			const serviceSheet = workbook.addWorksheet(`Revenue by Service - ${key}`);
			serviceSheet.columns = [
				{ header: 'Service Name', key: 'serviceName', width: 30 },
				{ header: 'Revenue', key: 'revenue', width: 15 },
			];
			revenueByService.forEach((service) => {
				serviceSheet.addRow({
					serviceName: service.serviceName,
					revenue: service.revenue,
				});
			});

			const roomTypeSheet = workbook.addWorksheet(
				`Revenue by Room Type - ${key}`,
			);
			roomTypeSheet.columns = [
				{ header: 'Room Type', key: 'roomType', width: 30 },
				{ header: 'Revenue', key: 'revenue', width: 15 },
			];
			revenueByRoomType.forEach((roomType) => {
				roomTypeSheet.addRow({
					roomType: roomType.roomType,
					revenue: roomType.revenue,
				});
			});
		}

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');

		await workbook.xlsx.write(res);
		res.end();
	}

	async getRoomCountByRoomType(): Promise<
		{ roomType: string; count: number }[]
	> {
		try {
			console.log('Starting aggregation to get room count by room type');

			const roomCounts = await this.roomModel
				.aggregate([
					{
						$group: {
							_id: '$roomTypeId',
							count: { $sum: 1 },
						},
					},
					{
						$addFields: {
							_id: { $toObjectId: '$_id' },
						},
					},
					{
						$lookup: {
							from: 'roomtypes',
							localField: '_id',
							foreignField: '_id',
							as: 'roomType',
						},
					},
					{
						$unwind: {
							path: '$roomType',
							preserveNullAndEmptyArrays: false,
						},
					},
					{
						$project: {
							_id: 0,
							roomType: '$roomType.typeName',
							count: 1,
						},
					},
				])
				.exec();

			console.log('Aggregation result:', roomCounts);
			return roomCounts;
		} catch (error) {
			console.error('Error during aggregation:', error.message);
			throw new Error('Failed to get room count by room type');
		}
	}

	async getServiceCountByServiceType(): Promise<
		{ serviceType: string; count: number }[]
	> {
		try {
			const serviceCounts = await this.serviceModel
				.aggregate([
					{
						$group: {
							_id: '$serviceTypeId',
							count: { $sum: 1 },
						},
					},
					{
						$addFields: {
							_id: { $toObjectId: '$_id' },
						},
					},
					{
						$lookup: {
							from: 'serviceTypes',
							localField: '_id',
							foreignField: '_id',
							as: 'serviceType',
						},
					},
					{
						$unwind: {
							path: '$serviceType',
							preserveNullAndEmptyArrays: false,
						},
					},
					{
						$project: {
							_id: 0,
							serviceType: '$serviceType.typeName',
							count: 1,
						},
					},
				])
				.exec();

			this.logger.log('Aggregation result:', serviceCounts);
			return serviceCounts;
		} catch (error) {
			this.logger.error('Error during aggregation:', error.message);
			throw new Error('Failed to get service count by service type');
		}
	}

	async exportBookingToExcel(res: Response): Promise<void> {
		const bookings = await this.bookingModel.find().exec();

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Bookings');

		worksheet.columns = [
			{ header: 'Booking ID', key: 'id', width: 30 },
			{ header: 'Room Type', key: 'roomType', width: 30 },
			{ header: 'Room Number', key: 'roomNumber', width: 30 },
			{ header: 'Customer Name', key: 'customerName', width: 30 },
			{ header: 'Customer Phone', key: 'customerPhone', width: 30 },
			{ header: 'Check-in Date', key: 'checkinDate', width: 30 },
			{ header: 'Check-out Date', key: 'checkoutDate', width: 30 },
			{ header: 'Total Amount', key: 'totalAmount', width: 20 },
			{ header: 'Status', key: 'status', width: 20 },
			{ header: 'Guests', key: 'guests', width: 20 },
			{ header: 'Services', key: 'services', width: 40 },
		];

		await Promise.all(
			bookings.map(async (booking) => {
				const customer = await this.userModel
					.findById(booking.customerId.toString())
					.exec();
				const room = await this.roomModel
					.findById(booking.roomId.toString())
					.exec();
				const roomType = await this.roomTypeModel
					.findById(room.roomTypeId.toString())
					.exec();

				const guestsInfo = `Adults: ${booking.guests.adults}, Children: ${booking.guests.children}`;

				const serviceNames = booking.services
					.map((service) => service.name)
					.join(', ');

				worksheet.addRow({
					id: booking._id.toString(),
					roomType: roomType.typeName,
					roomNumber: room.roomNumber,
					customerName: customer
						? `${customer.firstName} ${customer.lastName}`
						: 'N/A',
					customerPhone: customer ? customer.phoneNumber : 'N/A',
					checkinDate: booking.checkinDate
						? booking.checkinDate.toLocaleString()
						: 'N/A',
					checkoutDate: booking.checkoutDate
						? booking.checkoutDate.toLocaleString()
						: 'N/A',
					totalAmount: booking.totalAmount || 0,
					status: booking.status || 'N/A',
					guests: guestsInfo,
					services: serviceNames,
				});
			}),
		);

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader('Content-Disposition', 'attachment; filename=bookings.xlsx');

		await workbook.xlsx.write(res);
		res.end();
	}

	async exportPromotionsToExcel(res: Response): Promise<void> {
		const promotions = await this.promotionModel.find().exec();

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Promotions');

		worksheet.columns = [
			{ header: 'ID', key: 'id', width: 30 },
			{ header: 'Promotion Name', key: 'promotionName', width: 30 },
			{ header: 'Description', key: 'description', width: 30 },
			{ header: 'Amount', key: 'amount', width: 20 },
			{ header: 'Discount', key: 'discount', width: 20 },
			{ header: 'Start Date', key: 'startDate', width: 20 },
			{ header: 'End Date', key: 'endDate', width: 20 },
		];

		promotions.forEach((promotion) => {
			worksheet.addRow({
				id: promotion.id,
				promotionName: promotion.promotionName,
				description: promotion.description,
				amount: promotion.amount,
				discount: promotion.discount,
				startDate: promotion.startDate,
				endDate: promotion.endDate,
			});
		});

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=promotions.xlsx',
		);
		await workbook.xlsx.write(res);
		res.end();
	}

	async exportRoomsToExcel(res: Response): Promise<void> {
		const rooms = await this.roomModel.find().exec();
		const roomTypes = await this.roomTypeModel.find().exec();

		const roomsWithImages = rooms.map((room) => ({
			...room.toObject(),
			images: room.images.join('\r\n') || 'N/A',
		}));

		const workbook = new ExcelJS.Workbook();

		const addSheetWithData = (
			sheetName: string,
			data: any[],
			columns: { header: string; key: string; width: number }[],
			rowFormatter: (item: any) => Record<string, any>,
		) => {
			const sheet = workbook.addWorksheet(sheetName);
			sheet.columns = columns;
			data.forEach((item) => {
				sheet.addRow(rowFormatter(item));
			});
		};

		addSheetWithData(
			'Rooms',
			roomsWithImages,
			[
				{ header: 'Room ID', key: 'id', width: 30 },
				{ header: 'Room Number', key: 'roomNumber', width: 20 },
				{ header: 'Status', key: 'status', width: 20 },
				{ header: 'Price Per Night', key: 'pricePerNight', width: 15 },
				{ header: 'Average Rating', key: 'averageRating', width: 15 },
				{ header: 'Images', key: 'images', width: 50 },
			],
			(room) => ({
				id: room._id.toString(),
				roomNumber: room.roomNumber,
				status: room.status,
				pricePerNight: room.pricePerNight,
				averageRating: room.averageRating || 0,
				images: room.images || 'N/A',
			}),
		);

		addSheetWithData(
			'Room Types',
			roomTypes,
			[
				{ header: 'Room Type ID', key: 'id', width: 30 },
				{ header: 'Type Name', key: 'typeName', width: 30 },
				{ header: 'Description', key: 'description', width: 50 },
				{ header: 'Base Price', key: 'basePrice', width: 15 },
				{ header: 'Guest Amount', key: 'guestAmount', width: 15 },
				{ header: 'Bed Amount', key: 'bedAmount', width: 15 },
				{ header: 'Bedroom Amount', key: 'bedroomAmount', width: 15 },
				{ header: 'Shared Bath Amount', key: 'sharedBathAmount', width: 20 },
				{ header: 'Amenities', key: 'amenities', width: 50 },
				{ header: 'Key Features', key: 'keyFeatures', width: 50 },
			],
			(roomType) => ({
				id: roomType._id.toString(),
				typeName: roomType.typeName,
				description: roomType.description || 'N/A',
				basePrice: roomType.basePrice,
				guestAmount: roomType.guestAmount,
				bedAmount: roomType.bedAmount,
				bedroomAmount: roomType.bedroomAmount,
				sharedBathAmount: roomType.sharedBathAmount,
				amenities: roomType.amenities.join(', ') || 'N/A',
				keyFeatures: roomType.keyFeatures.join(', ') || 'N/A',
			}),
		);

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader('Content-Disposition', 'attachment; filename=rooms.xlsx');

		await workbook.xlsx.write(res);
		res.end();
	}

	async exportServicesToExcel(res: Response): Promise<void> {
		const services = await this.serviceModel.find().exec();
		const serviceTypes = await this.serviceTypeModel.find();

		const serviceTypeMap = serviceTypes.reduce((map, serviceType) => {
			map[serviceType._id.toString()] = serviceType;
			return map;
		}, {});

		const servicesWithTypeNames = services.map((service) => {
			const serviceType =
				serviceTypeMap[service.serviceTypeId.toString()] || null;
			return {
				...service.toObject(),
				serviceTypeName: serviceType ? serviceType.typeName : 'N/A',
			};
		});

		const workbook = new ExcelJS.Workbook();

		const addSheetWithData = (
			sheetName: string,
			data: any[],
			columns: { header: string; key: string; width: number }[],
			rowFormatter: (item: any) => Record<string, any>,
		) => {
			const sheet = workbook.addWorksheet(sheetName);
			sheet.columns = columns;
			data.forEach((item) => {
				sheet.addRow(rowFormatter(item));
			});
		};

		addSheetWithData(
			'Services',
			servicesWithTypeNames,
			[
				{ header: 'Service ID', key: 'id', width: 30 },
				{ header: 'Name', key: 'name', width: 25 },
				{ header: 'Service Type', key: 'serviceTypeName', width: 30 },
				{ header: 'Description', key: 'description', width: 50 },
				{ header: 'Price', key: 'price', width: 15 },
			],
			(service) => ({
				id: service._id.toString(),
				name: service.serviceName,
				serviceTypeName: service.serviceTypeName || 'N/A',
				description: service.description || 'N/A',
				price: service.price || 0,
			}),
		);

		addSheetWithData(
			'Service Types',
			serviceTypes,
			[
				{ header: 'Service Type ID', key: 'id', width: 30 },
				{ header: 'Name', key: 'name', width: 30 },
				{ header: 'Description', key: 'description', width: 50 },
			],
			(serviceType) => ({
				id: serviceType._id.toString(),
				name: serviceType.typeName,
				description: serviceType.description || 'N/A',
			}),
		);

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader('Content-Disposition', 'attachment; filename=services.xlsx');
		await workbook.xlsx.write(res);
		res.end();
	}

	async exportUsersToExcel(res: Response): Promise<void> {
		const users = await this.userModel.find({ role: 'user' }).exec();

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Users');

		worksheet.columns = [
			{ header: 'User ID', key: 'id', width: 30 },
			{ header: 'Name', key: 'name', width: 25 },
			{ header: 'Email', key: 'email', width: 30 },
			{ header: 'Phone Number', key: 'phone', width: 20 },
			{ header: 'Status', key: 'status', width: 20 },
		];

		users.forEach((user) => {
			worksheet.addRow({
				id: user._id.toString(),
				name: user.firstName + ' ' + user.lastName,
				email: user.email,
				phone: user.phoneNumber ? user.phoneNumber : 'N/A',
				status: user.isActive ? 'Active' : 'Inactive',
			});
		});

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
		await workbook.xlsx.write(res);
		res.end();
	}

	async exportStaffToExcel(res: Response): Promise<void> {
		const serviceStaff = await this.userModel
			.find({ role: 'service_staff' })
			.exec();
		const receptionist = await this.userModel
			.find({ role: 'receptionist' })
			.exec();
		const allStaff = [...serviceStaff, ...receptionist];

		const workbook = new ExcelJS.Workbook();

		const allStaffSheet = workbook.addWorksheet('All Staff');
		allStaffSheet.columns = [
			{ header: 'Staff ID', key: 'id', width: 30 },
			{ header: 'Name', key: 'name', width: 25 },
			{ header: 'Email', key: 'email', width: 30 },
			{ header: 'Role', key: 'role', width: 20 },
			{ header: 'Status', key: 'status', width: 20 },
		];
		allStaff.forEach((staff) => {
			allStaffSheet.addRow({
				id: staff._id.toString(),
				name: staff.firstName + ' ' + staff.lastName,
				email: staff.email,
				role: staff.role === 'receptionist' ? 'Receptionist' : 'Service Staff',
				status: staff.isActive ? 'Active' : 'Inactive',
			});
		});

		const serviceStaffSheet = workbook.addWorksheet('Service Staff');
		serviceStaffSheet.columns = [
			{ header: 'Staff ID', key: 'id', width: 30 },
			{ header: 'Name', key: 'name', width: 25 },
			{ header: 'Email', key: 'email', width: 30 },
			{ header: 'Role', key: 'role', width: 20 },
			{ header: 'Status', key: 'status', width: 20 },
		];
		serviceStaff.forEach((staff) => {
			serviceStaffSheet.addRow({
				id: staff._id.toString(),
				name: staff.firstName + ' ' + staff.lastName,
				email: staff.email,
				role: 'Service Staff',
				status: staff.isActive ? 'Active' : 'Inactive',
			});
		});

		const receptionistSheet = workbook.addWorksheet('Receptionist');
		receptionistSheet.columns = [
			{ header: 'Staff ID', key: 'id', width: 30 },
			{ header: 'Name', key: 'name', width: 25 },
			{ header: 'Email', key: 'email', width: 30 },
			{ header: 'Role', key: 'role', width: 20 },
			{ header: 'Status', key: 'status', width: 20 },
		];
		receptionist.forEach((staff) => {
			receptionistSheet.addRow({
				id: staff._id.toString(),
				name: staff.firstName + ' ' + staff.lastName,
				email: staff.email,
				role: 'Receptionist',
				status: staff.isActive ? 'Active' : 'Inactive',
			});
		});

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader('Content-Disposition', 'attachment; filename=staff.xlsx');
		await workbook.xlsx.write(res);
		res.end();
	}
}
